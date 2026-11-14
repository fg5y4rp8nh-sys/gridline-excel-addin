# Assembles the Apps Script project in dist/: Code.gs, lib.gs, Sidebar.html, appsscript.json
import os, json
B='build'; D='dist'; os.makedirs(D, exist_ok=True)
css=open(f'{B}/sidebar.css').read(); js=open(f'{B}/sidebar.js').read().replace('</script','<\\/script')
html=open('server/Sidebar.template.html').read().replace('/*CSS*/',css).replace('/*JS*/',js)
open(f'{D}/Sidebar.html','w').write(html)
open(f'{D}/Code.gs','w').write(open('server/Code.js').read())
open(f'{D}/lib.gs','w').write('// Generated from src/lib/data.ts and src/lib/clean.ts — do not edit by hand (npm run build).\n'+open(f'{B}/lib.js').read())
json.dump({"timeZone":"Etc/UTC","exceptionLogging":"STACKDRIVER","runtimeVersion":"V8",
 "oauthScopes":["https://www.googleapis.com/auth/spreadsheets.currentonly","https://www.googleapis.com/auth/script.container.ui",
  "https://www.googleapis.com/auth/drive.file","https://www.googleapis.com/auth/script.external_request"]},open(f'{D}/appsscript.json','w'),indent=2)
for f in sorted(os.listdir(D)): print(f, os.path.getsize(f'{D}/{f}'))
