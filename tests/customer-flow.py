import urllib.request,urllib.error,http.cookiejar,json,uuid,secrets,concurrent.futures,pathlib,time
import os
BASE=os.environ.get('TECHSHOP_TEST_URL','http://127.0.0.1:5173').rstrip('/')
checks=[]
def request(path,method='GET',data=None,jar=None,headers=None):
 opener=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar)) if jar is not None else urllib.request.build_opener()
 hdr={'Content-Type':'application/json',**(headers or {})}
 req=urllib.request.Request(BASE+path,method=method,headers=hdr,data=None if data is None else json.dumps(data).encode())
 try:
  with opener.open(req,timeout=30) as r:return r.status,json.load(r),r.headers
 except urllib.error.HTTPError as e:
  try:body=json.load(e)
  except:body={}
  return e.code,body,e.headers

def check(name,condition):
 assert condition,name
 checks.append(name);print('PASS',name,flush=True)

a=http.cookiejar.CookieJar();b=http.cookiejar.CookieJar();tag=uuid.uuid4().hex[:10];pw=secrets.token_urlsafe(18)
email='qa-'+tag+'@techshop.demo'
code,user,h=request('/api/users','POST',{'name':'Demo Verification','email':email,'password':pw,'isAdmin':True},a)
check('registration and privilege escalation blocked',code==201 and user['isAdmin']==False)
check('secure session cookie',all(v in h.get('Set-Cookie','') for v in ['HttpOnly','Secure','SameSite=Lax']))
code,other,_=request('/api/users','POST',{'name':'Demo Second Account','email':'qa-other-'+tag+'@techshop.demo','password':pw},b);check('second account registration',code==201)
code,profile,_=request('/api/users/profile','PUT',{'name':'Demo Verification Updated','email':email},a);check('profile update without password',code==200)
code,_,_=request('/api/users/login','POST',{'email':email,'password':pw},a);check('profile save does not corrupt password hash',code==200)
code,_,_=request('/api/users','GET',jar=a);check('admin users endpoint denied to regular account',code==403)
code,products,_=request('/api/products?category=Accessories&sort=price-asc');check('category and sort',code==200 and all(p['category']=='Accessories' for p in products['products']) and products['products'][0]['price']<=products['products'][-1]['price'])
p=products['products'][0];stock=p['countInStock'];price=p['price']
code,empty,_=request('/api/products?keyword=zzzz-nonexistent');check('empty search',code==200 and empty['total']==0)
code,_,_=request('/api/products/not-a-uuid');check('invalid product id returns 400',code==400)
code,_,_=request('/api/upload','POST',{},a);check('uploads denied to regular account',code==403)
body={'orderItems':[{'_id':p['_id'],'qty':1,'price':.01}],'shippingAddress':{'address':'24 Demo Street','city':'Istanbul','postalCode':'34000','country':'Turkey'},'paymentMethod':'Demo','itemsPrice':.01,'totalPrice':.01,'isPaid':True}
key=str(uuid.uuid4());code,order,_=request('/api/orders','POST',body,a,{'Idempotency-Key':key});check('server-owned prices and simulated order state',code==201 and order['itemsPrice']==price and not order['isPaid'] and not order['demoCompleted'])
oid=order['_id']
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
 responses=list(pool.map(lambda _:request('/api/orders','POST',body,a,{'Idempotency-Key':key}),range(3)))
check('concurrent duplicate checkout is idempotent',all(c==201 and o['_id']==oid for c,o,h in responses))
code,current,_=request('/api/products/'+p['_id']);check('stock decremented exactly once',current['countInStock']==stock-1)
code,_,_=request('/api/orders/'+oid,'GET',jar=b);check('order privacy enforced',code==403)
code,_,_=request('/api/orders/'+oid+'/pay','PUT',{},b);check('another account cannot complete order',code==403)
code,_,_=request('/api/products/'+p['_id']+'/reviews','POST',{'rating':5,'comment':'Demo product experience.'},a);check('review requires completed order',code==403)
code,paid,_=request('/api/orders/'+oid+'/pay','PUT',{},a);check('demo completion never marks real paid',code==200 and paid['demoCompleted'] and not paid['isPaid'] and paid['paymentResult']['status']=='SIMULATED')
code,_,_=request('/api/products/'+p['_id']+'/reviews','POST',{'rating':5,'comment':'Live verification: the demo checkout flow was completed.'},a);check('completed buyer can review',code==201)
code,_,_=request('/api/products/'+p['_id']+'/reviews','POST',{'rating':5,'comment':'Duplicate review.'},a);check('duplicate review rejected',code==409)
code,orders,_=request('/api/orders/mine','GET',jar=a);check('order persists in account history',code==200 and any(o['_id']==oid for o in orders))
bad={**body,'orderItems':[{'_id':p['_id'],'qty':-1}]};code,_,_=request('/api/orders','POST',bad,a,{'Idempotency-Key':str(uuid.uuid4())});check('negative quantity rejected',code==400)
bad={**body,'orderItems':body['orderItems']*2};code,_,_=request('/api/orders','POST',bad,a,{'Idempotency-Key':str(uuid.uuid4())});check('duplicate line rejected',code==400)
newpw=secrets.token_urlsafe(18);code,_,_=request('/api/users/profile','PUT',{'name':'Demo Verification','email':email,'password':newpw,'currentPassword':'WrongPassword123!'},a);check('password change requires current password',code==403)
code,_,_=request('/api/users/profile','PUT',{'name':'Demo Verification','email':email,'password':newpw,'currentPassword':pw},a);check('password change succeeds',code==200)
code,_,_=request('/api/users/login','POST',{'email':email,'password':pw});check('old password rejected',code==401)
code,_,_=request('/api/users/login','POST',{'email':email,'password':newpw},a);check('new password works',code==200)
code,_,_=request('/api/users/logout','POST',{},a);code,_,_=request('/api/users/profile','GET',jar=a);check('logout revokes session',code==401)
pathlib.Path('/tmp/techshop-live-test-result.json').write_text(json.dumps({'passed':checks,'orderId':oid,'fixtureEmail':email},ensure_ascii=False,indent=2))
print('All',len(checks),'live checks passed.')
