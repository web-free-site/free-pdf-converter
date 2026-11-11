import json,sys
name, compat, cfgjson, headers_file = sys.argv[1], sys.argv[2], sys.argv[3], (sys.argv[4] if len(sys.argv)>4 else '')
src=open(f'{name}/worker.js').read()
config=json.loads(cfgjson)
if headers_file: config['_headers']=open(headers_file).read()
meta={"main_module":"worker.js","compatibility_date":compat,"bindings":[{"type":"assets","name":"ASSETS"}],"keep_assets":True,"assets":{"config":config},
      "annotations":{"workers/message":"adfix: inline Adsterra banners"}}
code = "async () => {\n const src = %s;\n const meta = %s;\n const form = new FormData();\n form.append('metadata', new Blob([JSON.stringify(meta)], {type:'application/json'}));\n form.append('worker.js', new Blob([src], {type:'application/javascript+module'}), 'worker.js');\n const r = await cloudflare.request({method:'POST', path:`/accounts/${accountId}/workers/scripts/%s/versions`, body: form});\n return {id: r.result.id, number: r.result.number, assets: r.result.resources && r.result.resources.script_runtime && r.result.resources.script_runtime.assets ? Object.keys(r.result.resources.script_runtime.assets) : null, raw: JSON.stringify(r.result).slice(0,1500)};\n}" % (json.dumps(src), json.dumps(meta), name)
open(f'{name}/upload-version.js','w').write(code)
print(len(code))
