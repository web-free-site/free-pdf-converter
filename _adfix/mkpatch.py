import json,sys,base64
name=sys.argv[1]; extra=json.loads(sys.argv[2]) if len(sys.argv)>2 else {}
src=open(f'{name}/worker.js').read()
body={"modules":[{"name":"worker.js","content_type":"application/javascript+module","content_base64":base64.b64encode(src.encode()).decode()}],"main_module":"worker.js","annotations":{"workers/message":"adfix v2"}}
body.update(extra)
code="async () => { const r = await cloudflare.request({method:'PATCH', path:`/accounts/${accountId}/workers/workers/%s/versions/latest`, query:{deploy:false}, body:%s}); return {id:r.result.id, number:r.result.number, assets:r.result.assets, main:r.result.main_module}; }" % (name, json.dumps(body))
open(f'{name}/patch-version.js','w').write(code); print(len(code))
