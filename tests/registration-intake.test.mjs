import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  registrationAge,
  registrationGroup,
  intakeValues,
  intakeStepError,
} from "../src/lib/registration-flow.ts";
import { createBackend } from "../server/backend.mjs";
import { handleRequest } from "../server/next-handler.mjs";
import { validValues, memoryStorage } from "./profile-fixtures.mjs";
const today = "2026-10-30";
test("Intake age policy uses exact birthday boundaries and rejects impossible dates", () => {
  for (const [birth, expected] of [
    ["2010-10-31", "children"],
    ["2010-10-30", "youth"],
    ["1986-10-30", "youth"],
    ["1985-10-31", "youth"],
    ["1985-10-30", "congregation"],
    ["2020-02-29", "children"],
  ])
    assert.equal(registrationGroup(birth, today), expected, birth);
  for (const date of [
    "",
    "2026-10-31",
    "2001-02-29",
    "2025-13-01",
    "1899-10-01",
    "2000-1-01",
  ])
    assert.equal(registrationGroup(date, today), null, date);
  assert.equal(registrationAge("2010-10-31", today), 15);
  assert.equal(registrationAge("2010-10-30", today), 16);
});
test("Cluster gates block incomplete details and adults without phone; group changes remove children-only values", () => {
  const v = validValues({
    birthday: "2011-01-01",
    phone: "",
    parentName: "Phụ huynh",
    nickname: "Bông",
    caregiver: "forged",
    notes: "forged",
  });
  assert.equal(intakeStepError(0, v, today), "");
  assert.equal(intakeStepError(2, v, today), "");
  assert.ok(intakeStepError(0, { ...v, name: " " }, today));
  assert.ok(intakeStepError(1, { ...v, team: "" }, today));
  assert.ok(intakeStepError(3, { ...v, avatar: "" }, today));
  assert.ok(intakeStepError(2, { ...v, birthday: "2000-01-01" }, today));
  assert.ok(intakeStepError(2, { ...v, relativePhone: "1234" }, today));
  const adult = intakeValues(v, "youth");
  assert.equal("parentName" in adult, false);
  assert.equal("nickname" in adult, false);
  assert.equal("caregiver" in adult, false);
  assert.equal("notes" in adult, false);
  assert.equal(intakeValues(v, "children").nickname, "Bông");
});
test("Automatic registration derives group on server, persists nickname and respects public/staff review and retries", async () => {
  const { app, db } = await createBackend({
    dataDir: "memory://",
    rateLimits: false,
    storage: memoryStorage(),
    now: () => Date.parse(today + "T12:00:00Z"),
  });
  const call = async (path, body, cookie) => {
    const r = await handleRequest(
      app,
      new Request("http://127.0.0.1:5173/api" + path, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://127.0.0.1:5173",
          ...(cookie ? { Cookie: cookie } : {}),
        },
        body: JSON.stringify(body),
      }),
    );
    return {
      status: r.status,
      data: await r.json(),
      cookie: r.headers.getSetCookie()[0]?.split(";")[0],
    };
  };
  try {
    const dev = (
      await call("/admin/login", { username: "dev", password: "1@345678" })
    ).cookie;
    const cases = [
      ["2010-10-31", "children"],
      ["2010-10-30", "youth"],
      ["1986-10-30", "youth"],
      ["1985-10-30", "congregation"],
    ];
    for (const [birthday, group] of cases) {
      const values = intakeValues(
          validValues({
            name: "Tuổi " + birthday,
            birthday,
            ...(group === "children"
              ? { phone: "", nickname: "Bông", parentName: "Phụ huynh" }
              : {}),
          }),
          group,
        ),
        body = { values, requestId: randomUUID() };
      const result = await call("/registrations/auto", body);
      assert.equal(result.status, 201, JSON.stringify(result.data));
      assert.equal(result.data.status, "pending");
      assert.equal((await call("/registrations/auto", body)).status, 200);
      const row = (
        await db.query("SELECT * FROM members WHERE name=$1", [values.name])
      ).rows[0];
      assert.equal(row.group, group);
      if (group === "children") assert.equal(row.profile_data.nickname, "Bông");
      assert.equal(
        (
          await call("/registrations/auto", {
            ...body,
            values: { ...values, name: "Edited" },
          })
        ).status,
        409,
      );
    }
    const result = await call(
      "/registrations/auto",
      {
        values: validValues({ birthday: "2000-01-01", name: "Staff intake" }),
        requestId: randomUUID(),
      },
      dev,
    );
    assert.equal(result.data.status, "approved");
    assert.equal(
      (
        await call("/registrations/auto", {
          values: validValues({ birthday: "2010-10-30", phone: "" }),
          requestId: randomUUID(),
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await call("/registrations/auto", {
          values: validValues({ birthday: "2999-01-01" }),
          requestId: randomUUID(),
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await call("/registrations/auto", {
          values: validValues({
            birthday: "2010-10-30",
            nickname: "Adult forged field",
          }),
          requestId: randomUUID(),
        })
      ).status,
      400,
    );
    assert.equal(
      (await db.query("SELECT count(*)::int AS n FROM members")).rows[0].n,
      5,
    );
  } finally {
    await db.close();
  }
});
