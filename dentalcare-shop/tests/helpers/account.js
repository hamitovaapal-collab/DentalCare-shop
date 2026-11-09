import products from '../../src/data/products.json' with {type:'json'};
export async function mockService(page,{loggedIn=false,admin=false,profileMissing=false,theme='light',stockZero=false,reviews=[]}={}) {
 await page.addInitScript(({products,loggedIn,admin,profileMissing,theme,stockZero,reviews})=>{
  localStorage.setItem('theme',theme);
  window.fixture={loggedIn,admin,profileMissing,failReset:false,products:products.map(p=>stockZero&&p.id==='p1'?{...p,stock:0}:p),orders:[],bookings:[],reviews,writes:[]};
 },{products,loggedIn,admin,profileMissing,theme,stockZero,reviews});
 await page.route(/\/src\/lib\/supabase\.js(?:\?.*)?$/,route=>route.fulfill({contentType:'application/javascript',body:`
 const f=window.fixture; const user={id:'test-user',email:'test@example.com'}; let listener=()=>{};
 const session=()=>f.loggedIn?{user,access_token:'test-session'}:null;
 export const initializeSupabase=async()=>supabase;
 export const supabase={auth:{
 getSession:async()=>({data:{session:session()}}),onAuthStateChange:cb=>{listener=cb;return {data:{subscription:{unsubscribe(){}}}}},
 signInWithPassword:async()=>{f.loggedIn=true;listener('SIGNED_IN',session());return {data:{session:session()}}},
 signUp:async()=>({data:{session:null}}),resetPasswordForEmail:async()=>({error:f.failReset?{message:'offline'}:null}),
 updateUser:async()=>({}),signOut:async()=>{f.loggedIn=false;listener('SIGNED_OUT',null);return {}}
 },from(table){let op='select',body,single=false;const q={select(){return q},eq(){return q},in(){return q},order(){return q},limit(){return q},maybeSingle(){single=true;return q},
 update(value){op='update';body=value;return q},insert(value){op='insert';body=value;return q},delete(){op='delete';return q},
 then(resolve,reject){if(op!=='select')f.writes.push({table,op,body});let data=table==='profiles'?(f.profileMissing?null:{id:user.id,full_name:'Test Customer',phone:'+996500000000',role:f.admin?'admin':'user',created_at:'2026-01-01'}):f[table]||[];
 if(table==='profiles'&&!single)data=[data];return Promise.resolve({data,error:null}).then(resolve,reject)} };return q;}};
 `}));
}
