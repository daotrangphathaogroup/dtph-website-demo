/** @type {import('next').NextConfig} */
const config={outputFileTracingExcludes:{'/**':['./.local/**/*','./.env*','./tests/**/*','./docs/**/*','./.vercel/**/*']},serverExternalPackages:['@electric-sql/pglite','pg','sharp','@aws-sdk/client-s3'],async headers(){return [{source:'/:path*',headers:[{key:'X-Content-Type-Options',value:'nosniff'},{key:'Referrer-Policy',value:'strict-origin-when-cross-origin'},{key:'X-Frame-Options',value:'DENY'},{key:'Permissions-Policy',value:'camera=(), microphone=(), geolocation=()'}]}];}};
export default config;
