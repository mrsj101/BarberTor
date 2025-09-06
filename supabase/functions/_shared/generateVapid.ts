import webpush from "https://deno.land/x/webpush@1.5.0/mod.ts";

const keys = webpush.generateVAPIDKeys();
console.log(JSON.stringify(keys, null, 2));
