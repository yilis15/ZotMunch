const SEED = [
  {id:1,name:"Spicy Garlic Tonkotsu",emoji:"🍜",restaurant:"Menya Hikari",plaza:"University Town Center",price:16.5,dist:0.4,cuisine:"Japanese",type:"Noodles",tags:["Spicy","Asian","Late night","Comfort food"],likes:214,up:188,down:9,by:{n:"Kenta M.",from:"Japan",yr:"3rd yr · CS"},note:"Tastes closest to the ramen back home. Ask for the black garlic oil.",comments:[{u:"Priya S.",t:"Add the extra chashu, it's worth the $3."},{u:"Diego R.",t:"The line gets long after 7pm on weeknights."}]},
  {id:2,name:"Brown Sugar Boba Milk",emoji:"🧋",restaurant:"Leaf & Pearl",plaza:"University Town Center",price:6.25,dist:0.3,cuisine:"Taiwanese",type:"Drinks",tags:["Boba & drinks","Asian","Cheap eats","Dessert"],likes:342,up:301,down:22,by:{n:"Mei-Ling C.",from:"Taiwan",yr:"2nd yr · Bio Sci"},note:"Pearls are cooked fresh every few hours. Go 30% sugar.",comments:[{u:"Alex T.",t:"My midterm-week fuel."}]},
  {id:3,name:"Birria Tacos (3) + Consommé",emoji:"🌮",restaurant:"Taquería Los Primos",plaza:"Campus Plaza",price:13,dist:1.8,cuisine:"Mexican",type:"Tacos",tags:["Mexican","Comfort food","Spicy"],likes:276,up:250,down:11,by:{n:"Diego R.",from:"Mexico",yr:"4th yr · Econ"},note:"Dip it all the way in. The consommé is the point.",comments:[{u:"Sam K.",t:"Tuesday deal makes it $10."}]},
  {id:4,name:"Phở Tái",emoji:"🍲",restaurant:"Phở Sài Gòn Corner",plaza:"Culver Plaza",price:14,dist:2.1,cuisine:"Vietnamese",type:"Noodles",tags:["Asian","Comfort food"],likes:158,up:140,down:6,by:{n:"Linh N.",from:"Vietnam",yr:"Grad · Nursing"},note:"Clear, long-simmered broth. Real basil and sawtooth herb on the side.",comments:[]},
  {id:5,name:"Galbi Combo Plate",emoji:"🥩",restaurant:"Seoul Grill House",plaza:"Diamond Jamboree",price:24,dist:3.5,cuisine:"Korean",type:"Rice",tags:["Asian","Comfort food"],likes:131,up:110,down:15,by:{n:"Jiwoo P.",from:"South Korea",yr:"3rd yr · Psych"},note:"Pricey for a weeknight, but it feeds two if you add rice.",comments:[{u:"Kenta M.",t:"Banchan refills are free."}]},
  {id:6,name:"Spicy Ahi Poke Bowl",emoji:"🐟",restaurant:"Wave Poke",plaza:"University Town Center",price:15,dist:0.6,cuisine:"Hawaiian",type:"Rice",tags:["Spicy","Healthy"],likes:189,up:160,down:18,by:{n:"Kai L.",from:"Hawaii, USA",yr:"1st yr · Undeclared"},note:"Closest thing to island poke near campus. Get it with furikake.",comments:[]},
  {id:7,name:"Chicken Shawarma Plate",emoji:"🥙",restaurant:"Zaytoon Kitchen",plaza:"Campus Plaza",price:14.5,dist:1.2,cuisine:"Middle Eastern",type:"Rice",tags:["Halal","Comfort food","Healthy"],likes:203,up:191,down:5,by:{n:"Omar H.",from:"Jordan",yr:"2nd yr · Eng"},note:"Certified halal, and they don't hold back on the garlic sauce.",comments:[{u:"Aisha B.",t:"Finally a halal spot I can walk to."}]},
  {id:8,name:"Margherita Slices (2)",emoji:"🍕",restaurant:"Anteater Slice Co.",plaza:"University Town Center",price:7,dist:0.4,cuisine:"Italian",type:"Pizza",tags:["Cheap eats","Late night"],likes:122,up:98,down:20,by:{n:"Sam K.",from:"USA",yr:"4th yr · Film"},note:"Open till 1am, which matters during finals.",comments:[]},
  {id:9,name:"Xiao Long Bao (8)",emoji:"🥟",restaurant:"Golden Basket Dumpling",plaza:"Diamond Jamboree",price:12,dist:3.4,cuisine:"Chinese",type:"Dumplings",tags:["Asian","Comfort food"],likes:265,up:240,down:8,by:{n:"Yuxin W.",from:"China",yr:"Grad · Stats"},note:"Thin skins and a lot of soup. Bite a little hole first.",comments:[{u:"Linh N.",t:"Go before 11:30 on weekends."}]},
  {id:10,name:"Hyderabadi Chicken Biryani",emoji:"🍛",restaurant:"Spice Route Express",plaza:"Walnut Village",price:17,dist:4.2,cuisine:"Indian",type:"Rice",tags:["Spicy","Halal","Comfort food"],likes:174,up:160,down:7,by:{n:"Priya S.",from:"India",yr:"3rd yr · Info"},note:"Dum-cooked the proper way. Ask for raita to tone down the heat.",comments:[]},
  {id:11,name:"Lemongrass Pork Bánh Mì",emoji:"🥖",restaurant:"Saigon Sandwich Bar",plaza:"Culver Plaza",price:9,dist:2,cuisine:"Vietnamese",type:"Sandwich",tags:["Cheap eats","Asian"],likes:148,up:136,down:4,by:{n:"Linh N.",from:"Vietnam",yr:"Grad · Nursing"},note:"Crunchy baguette, not the soft supermarket kind. Under $10.",comments:[]},
  {id:12,name:"Mala Tofu (Vegan)",emoji:"🌶️",restaurant:"Sichuan Garden",plaza:"Diamond Jamboree",price:13,dist:3.3,cuisine:"Chinese",type:"Rice",tags:["Spicy","Vegan","Asian"],likes:97,up:85,down:9,by:{n:"Yuxin W.",from:"China",yr:"Grad · Stats"},note:"Real Sichuan peppercorn numbness, and it's fully vegan.",comments:[{u:"Mia J.",t:"Vegan option that isn't a sad salad!"}]},
  {id:13,name:"Ube Soft Serve",emoji:"🍦",restaurant:"Halo Halo Café",plaza:"Campus Plaza",price:6,dist:1.5,cuisine:"Filipino",type:"Dessert",tags:["Dessert","Cheap eats","Vegan"],likes:119,up:105,down:6,by:{n:"Bea D.",from:"Philippines",yr:"2nd yr · Art"},note:"It actually tastes like ube, not just purple.",comments:[]},
  {id:14,name:"Mala Hot Pot for One",emoji:"🫕",restaurant:"Little Red Pot",plaza:"Diamond Jamboree",price:22,dist:3.4,cuisine:"Chinese",type:"Hot pot",tags:["Spicy","Asian","Comfort food"],likes:187,up:170,down:10,by:{n:"Hao L.",from:"China",yr:"2nd yr · Math"},note:"Pick the half-and-half broth if you can't handle full mala.",comments:[{u:"Jiwoo P.",t:"Perfect after a cold night lab."}]},
  {id:15,name:"Pad Kee Mao (Drunken Noodles)",emoji:"🍝",restaurant:"Bangkok Corner",plaza:"Culver Plaza",price:14,dist:2.2,cuisine:"Thai",type:"Noodles",tags:["Spicy","Asian"],likes:166,up:150,down:8,by:{n:"Nok S.",from:"Thailand",yr:"3rd yr · Bus Admin"},note:"Ask for Thai spicy only if you mean it. Lots of holy basil.",comments:[]},
];
/* diet = restrictions the dish satisfies · allergens it contains · fam: 1 familiar, 2 mostly familiar, 3 adventurous
   flavor / scene / custom feed the Filters sheet */
const INFO = {
  1:{diet:["Dairy-Free"],allergens:["Eggs","Gluten-Wheat"],fam:1,flavor:["Spicy","Savory"],scene:["Eating Alone","Friends"],custom:["Dine-in","Takeout"]},
  2:{diet:["Vegetarian","Gluten-Free"],allergens:["Dairy"],fam:1,flavor:["Sweet"],scene:["Eating Alone","Date","Friends","Quick Meal"],custom:["Dine-in","Takeout","Delivery","Drive-thru"]},
  3:{diet:["Gluten-Free"],allergens:["Dairy"],fam:2,flavor:["Spicy","Savory"],scene:["Friends","Quick Meal"],custom:["Dine-in","Takeout"]},
  4:{diet:["Gluten-Free","Dairy-Free"],allergens:["Fish"],fam:2,flavor:["Savory","Light & Fresh"],scene:["Eating Alone","Family"],custom:["Dine-in","Takeout","Delivery"]},
  5:{diet:["Dairy-Free"],allergens:["Gluten-Wheat"],fam:2,flavor:["Savory","Sweet"],scene:["Date","Friends","Family"],custom:["Dine-in"]},
  6:{diet:["Dairy-Free"],allergens:["Fish","Shellfish","Eggs"],fam:2,flavor:["Spicy","Light & Fresh"],scene:["Eating Alone","Quick Meal"],custom:["Dine-in","Takeout","Delivery"]},
  7:{diet:["Halal","Gluten-Free","Dairy-Free"],allergens:[],fam:1,flavor:["Savory","Sour"],scene:["Eating Alone","Quick Meal"],custom:["Dine-in","Takeout","Delivery"]},
  8:{diet:["Vegetarian"],allergens:["Dairy","Gluten-Wheat"],fam:1,flavor:["Savory"],scene:["Eating Alone","Friends","Quick Meal"],custom:["Dine-in","Takeout","Delivery"]},
  9:{diet:[],allergens:["Gluten-Wheat"],fam:2,flavor:["Savory"],scene:["Date","Friends","Family"],custom:["Dine-in"]},
  10:{diet:["Halal","Gluten-Free"],allergens:["Dairy","Tree Nuts"],fam:2,flavor:["Spicy","Savory"],scene:["Friends","Family"],custom:["Dine-in","Takeout","Delivery"]},
  11:{diet:["Dairy-Free"],allergens:["Gluten-Wheat","Eggs","Fish"],fam:2,flavor:["Savory","Sour","Light & Fresh"],scene:["Eating Alone","Quick Meal"],custom:["Dine-in","Takeout"]},
  12:{diet:["Vegan","Vegetarian","Dairy-Free"],allergens:["Gluten-Wheat","Peanuts"],fam:3,flavor:["Spicy","Savory"],scene:["Friends","Family"],custom:["Dine-in","Takeout","Delivery"]},
  13:{diet:["Vegan","Vegetarian","Dairy-Free","Gluten-Free","Kosher"],allergens:["Tree Nuts"],fam:3,flavor:["Sweet"],scene:["Date","Friends","Quick Meal"],custom:["Dine-in","Takeout"]},
  14:{diet:["Dairy-Free"],allergens:["Gluten-Wheat","Shellfish","Peanuts"],fam:3,flavor:["Spicy","Savory"],scene:["Date","Friends","Family"],custom:["Dine-in"]},
  15:{diet:["Dairy-Free"],allergens:["Gluten-Wheat","Fish","Eggs"],fam:2,flavor:["Spicy","Savory"],scene:["Eating Alone","Friends"],custom:["Dine-in","Takeout","Delivery"]},
};
const DIETS = ["Vegetarian","Vegan","Halal","Kosher","Gluten-Free","Dairy-Free","No Restrictions"];
const ALLERGIES = ["Peanuts","Tree Nuts","Dairy","Eggs","Shellfish","Fish","Gluten-Wheat","No Allergies"];
const ADVENTURE = ["Familiar Favorites","Mostly Familiar","Open to Anything","Adventurous Eater"];
const NONE = {diet:"No Restrictions",allergies:"No Allergies"};
const CUISINES = [...new Set(SEED.map(d=>d.cuisine))];
const PHOTOS = ["🍜","🍣","🌮","🍔","🥗","🍛","🥟","🧋","🍰","🍗"];
const BUDGETS = {"Under $10":p=>p<10,"$10–15":p=>p>=10&&p<=15,"$15–25":p=>p>15&&p<=25,"$25+":p=>p>25};
const DISTS = {"Walking distance":0.7,"Under 5 min drive":1.5,"Under 10 min drive":3,"Under 15 min drive":5};
/* Filters sheet groups, in display order. test(dish, choice) says whether a dish matches one choice. */
const FILTERS = [
  {k:"cuisine",t:"Cuisine",opts:CUISINES,test:(d,v)=>d.cuisine===v},
  {k:"type",t:"Food Type",opts:["Rice","Noodles","Hot pot","Dumplings","Tacos","Pizza","Sandwich","Dessert","Drinks"],test:(d,v)=>d.type===v},
  {k:"flavor",t:"Flavor",opts:["Spicy","Sweet","Sour","Savory","Light & Fresh"],test:(d,v)=>d.flavor.includes(v)},
  {k:"budget",t:"Budget",opts:Object.keys(BUDGETS),test:(d,v)=>BUDGETS[v](d.price)},
  {k:"dist",t:"Distance",one:true,opts:Object.keys(DISTS),test:(d,v)=>d.dist<=DISTS[v]},
  {k:"scene",t:"Scene",opts:["Eating Alone","Date","Friends","Family","Quick Meal"],test:(d,v)=>d.scene.includes(v)},
  {k:"custom",t:"Eating Custom",opts:["Dine-in","Takeout","Delivery","Drive-thru"],test:(d,v)=>d.custom.includes(v)},
];
/* Restaurant pages: hours, price level and a short intro */
const RESTO = {
  "Menya Hikari":{hours:"11am – 11pm",lvl:"$$",about:"A small ramen bar with counter seating. Known for its rich pork broth; expect a short wait at dinner."},
  "Leaf & Pearl":{hours:"10am – 12am",lvl:"$",about:"Boba shop that cooks its pearls in small batches. A popular study-break stop."},
  "Taquería Los Primos":{hours:"9am – 10pm",lvl:"$",about:"Family-run taquería. Birria is the specialty, slow-cooked every morning."},
  "Phở Sài Gòn Corner":{hours:"10am – 9pm",lvl:"$$",about:"Neighborhood phở spot with a long-simmered broth and generous herb plates."},
  "Seoul Grill House":{hours:"11:30am – 11pm",lvl:"$$$",about:"Korean BBQ with tabletop grills and free banchan refills. Good for groups."},
  "Wave Poke":{hours:"11am – 9pm",lvl:"$$",about:"Build-your-own poke bowls with fish delivered daily."},
  "Zaytoon Kitchen":{hours:"11am – 10pm",lvl:"$$",about:"Certified halal Middle Eastern kitchen. Shawarma is carved to order."},
  "Anteater Slice Co.":{hours:"11am – 1am",lvl:"$",about:"Pizza by the slice, open late. The go-to during finals week."},
  "Golden Basket Dumpling":{hours:"11am – 9:30pm",lvl:"$$",about:"Dumpling house where you can watch the xiao long bao being folded."},
  "Spice Route Express":{hours:"11am – 10pm",lvl:"$$",about:"South Indian and Hyderabadi dishes. Biryani is dum-cooked in sealed pots."},
  "Saigon Sandwich Bar":{hours:"8am – 7pm",lvl:"$",about:"Bánh mì on bread baked in-house each morning."},
  "Sichuan Garden":{hours:"11am – 10pm",lvl:"$$",about:"Sichuan restaurant with real numbing peppercorn heat and several vegan dishes."},
  "Halo Halo Café":{hours:"12pm – 10pm",lvl:"$",about:"Filipino desserts and drinks. Ube everything."},
  "Little Red Pot":{hours:"11:30am – 12am",lvl:"$$",about:"Individual hot pots with a sauce bar. Late-night favorite."},
  "Bangkok Corner":{hours:"11am – 9:30pm",lvl:"$$",about:"Thai street food. Spice levels go from mild to actual Thai spicy."},
};
/* More student-recommended dishes, shown on restaurant pages: [seed id of the restaurant, name, emoji, price, likes, type, note, recommender] */
const EXTRA = [
  [1,"Shoyu Ramen","🍜",15,88,"Noodles","Lighter than the tonkotsu but just as good.","Alex T."],
  [1,"Chashu Rice Bowl","🍚",9,61,"Rice","Cheap add-on if you're extra hungry.","Kenta M."],
  [2,"Mango Green Tea","🥭",6,97,"Drinks","Refreshing, not too sweet.","Mia J."],
  [3,"Quesabirria","🧀",14,120,"Tacos","Cheesier version of the birria tacos.","Sam K."],
  [4,"Bún Bò Huế","🍲",15,74,"Noodles","Spicier phở cousin with lemongrass.","Linh N."],
  [5,"Bibimbap in Stone Bowl","🍚",17,83,"Rice","Wait for the crispy rice at the bottom.","Jiwoo P."],
  [6,"Salmon Avocado Bowl","🥑",14,66,"Rice","Good if you don't want spicy.","Kai L."],
  [7,"Falafel Wrap","🌯",11,92,"Sandwich","Vegan and very filling.","Aisha B."],
  [8,"Pepperoni Slices (2)","🍕",7.5,80,"Pizza","Classic late-night order.","Diego R."],
  [9,"Pork & Chive Dumplings","🥟",11,101,"Dumplings","Pan-fried, crispy bottoms.","Yuxin W."],
  [10,"Masala Dosa","🫓",13,77,"Rice","Huge, crispy, comes with two chutneys.","Priya S."],
  [11,"Vietnamese Iced Coffee","☕",5,69,"Drinks","Strong. You will not sleep.","Linh N."],
  [12,"Dan Dan Noodles","🍜",12,90,"Noodles","Nutty, spicy, a little numbing.","Hao L."],
  [13,"Halo-Halo","🍧",8,73,"Dessert","Shaved ice with everything on it.","Bea D."],
  [14,"Tomato Broth Hot Pot","🍅",21,58,"Hot pot","Non-spicy option that's still rich.","Mei-Ling C."],
  [15,"Mango Sticky Rice","🥭",8,86,"Dessert","Seasonal, get it when they have it.","Nok S."],
];
const POSTED = ["1 day ago","3 days ago","5 days ago","1 week ago","2 weeks ago"];
const AGO = ["2 hours ago","yesterday","2 days ago","4 days ago","1 week ago"];
const noFilters = ()=>Object.fromEntries(FILTERS.map(g=>[g.k,new Set()]));
const activeFilters = ()=>FILTERS.flatMap(g=>[...S.filters[g.k]]);

let S;
function fresh(){
  S = {
    screen:"signin", mode:"swipe", hist:[], detailId:null, resto:null, justLiked:false, onboarded:false,
    dishes: [
      ...SEED.map(d=>({...d,...INFO[d.id],tags:[...d.tags],posted:POSTED[d.id%POSTED.length],comments:d.comments.map((c,i)=>({...c,ago:AGO[(d.id+i)%AGO.length]})),liked:false,tried:false,vote:null})),
      ...EXTRA.map(([sid,name,emoji,price,likes,type,note,by],i)=>{const s=SEED.find(x=>x.id===sid);
        return {id:200+i,menuOnly:true,name,emoji,price,likes,type,note,restaurant:s.restaurant,plaza:s.plaza,dist:s.dist,cuisine:s.cuisine,
          tags:[],diet:[],allergens:[],fam:2,flavor:[],scene:[],custom:[],up:Math.round(likes*.9),down:Math.round(likes*.05),
          by:{n:by},posted:POSTED[i%POSTED.length],comments:[],liked:false,tried:false,vote:null};}),
    ],
    prefs:{diet:new Set([NONE.diet]),allergies:new Set([NONE.allergies]),adventure:"Open to Anything"},
    filters:noFilters(),
    swiped:new Set(), usedModes:new Set(),
    tasks:{spicy:false,find:false,comment:false,post:false,both:false},
    draft:{name:"",rest:"",price:"",cuisine:"",note:"",photo:null}, postErr:"", nextId:100,
  };
}
fresh();

const $ = s=>document.querySelector(s);
const esc = s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money = n=>"$"+Number(n).toFixed(2).replace(/\.00$/,"");
const dish = id=>S.dishes.find(d=>d.id===id);
const restoInfo = name=>RESTO[name]||{hours:"11am – 10pm",lvl:"$$",about:"Recommended by UCI students. More details coming soon."};

function visible(){
  const p=S.prefs;
  const diets=[...p.diet].filter(x=>x!==NONE.diet), allergies=[...p.allergies].filter(x=>x!==NONE.allergies);
  const fits=d=>diets.every(x=>d.diet.includes(x)) && !allergies.some(x=>d.allergens.includes(x));
  const passes=d=>FILTERS.every(g=>{const s=S.filters[g.k];return !s.size||[...s].some(v=>g.test(d,v));});
  const list=S.dishes.filter(d=>d.mine || (!d.menuOnly && fits(d) && passes(d)));
  const adv={"Familiar Favorites":(a,b)=>a.fam-b.fam,"Mostly Familiar":(a,b)=>(a.fam>2)-(b.fam>2),"Adventurous Eater":(a,b)=>b.fam-a.fam}[p.adventure];
  return list.sort((a,b)=> (b.mine?1:0)-(a.mine?1:0) || (adv&&adv(a,b)) || b.likes-a.likes);
}
function why(d){
  const p=S.prefs;
  if(d.mine) return "Your post";
  const diets=[...p.diet].filter(x=>x!==NONE.diet);
  if(diets.length) return "Fits "+diets.slice(0,2).join(", ");
  if(p.adventure==="Adventurous Eater"&&d.fam===3) return "Something new to try";
  if((p.adventure==="Familiar Favorites"||p.adventure==="Mostly Familiar")&&d.fam===1) return "A familiar favorite";
  return "Popular at UCI";
}

/* ---------- screens ---------- */
function prefGroup(k,title,hint,opts,on,action="pref"){
  return `<div class="section"><div class="row"><h4>${title}</h4><span class="fine">${hint}</span></div>
    <div class="chips" data-group="${k}">${opts.map(o=>`<button class="chip ${on(o)?"on":""}" data-a="${action}" data-k="${k}" data-v="${o}" aria-pressed="${on(o)}">${o}</button>`).join("")}</div></div>`;
}
function nav(active){
  const saved=S.dishes.filter(d=>d.liked).length;
  const b=(k,ic,l,cls="")=>`<button class="${cls} ${active===k?"on":""}" data-a="go" data-v="${k}" aria-label="${l}"><span class="ic">${ic}</span>${l}${k==="saved"&&saved?`<span class="badge">${saved}</span>`:""}</button>`;
  return `<nav class="nav">${b("home","⌂","Discover")}${b("post","+","Post","post")}${b("saved","♡","Saved")}${b("profile","☺","Me")}</nav>`;
}

const V = {
 signin(){
   return `<div class="body" style="gap:15px;justify-content:center;min-height:100%">
     <div class="mascot-wrap" aria-label="ZotMunch anteater mascot visual target"><span class="sparkle">✦</span><span class="mascot">🐜</span></div>
     <div style="display:grid;gap:5px;text-align:center"><div class="welcome-title"><b>Zot</b>Munch</div><p class="welcome-sub">Scroll, drool, munch, repeat!</p><p class="sub">Your next happy bite starts here.</p></div>
     <button class="btn primary" data-a="signin">G &nbsp; Continue with Google</button>
     <div class="divider">or use email</div>
     <form class="login" data-form="login" novalidate>
       <input type="email" id="login-email" placeholder="you@uci.edu" aria-label="Email address" autocomplete="email">
       <p class="err" id="login-err" hidden>Enter a valid email address</p>
       <button class="btn" type="submit">Continue with email</button>
     </form><p class="fine" style="text-align:center">Demo sign-in · no Google authentication or server connection</p>
   </div>`;
 },
tags(){
  const p=S.prefs;
  return `<div class="top">${S.onboarded?`<div class="row"><button class="back" data-a="go" data-v="profile">← Back</button></div>`:`<span class="brand"><b>Zot</b>Munch</span>`}</div>
  <div class="body">
    <div style="display:grid;gap:4px"><h2 class="h-hand">Everyday preferences</h2>
    <p class="sub">Set your dietary preferences and allergies. You can change them anytime.</p></div>
    ${prefGroup("diet","Dietary Restrictions","Select all that apply",DIETS,x=>p.diet.has(x))}
    ${prefGroup("allergies","Allergies","Select all that apply",ALLERGIES,x=>p.allergies.has(x))}
    <p class="fine">Allergen labels are illustrative only. Missing or incomplete information must be verified with the restaurant.</p>
    <button class="btn primary" data-a="start">${S.onboarded?"Save preferences":"Save preferences"}</button>${!S.onboarded?`<button class="btn ghost" data-a="start">Set up later</button>`:""}
  </div>`;
},
home(){
  const act=activeFilters();
  const head=`<div class="top">
    <div class="top-row"><div><div class="eyebrow-head">ZOTMUNCH / DISCOVER</div><div class="discover-heading">A bite of surprise.</div></div><span aria-hidden="true" style="font-size:38px">🍪</span></div>
      <div class="seg" role="tablist"><button class="${S.mode==="swipe"?"on":""}" data-a="mode" data-v="swipe">Swipe</button><button class="${S.mode==="feed"?"on":""}" data-a="mode" data-v="feed">Feed</button></div>
    <div class="filterbar">
      <button class="chip on" data-a="filters">☷ Filters${act.length?` · ${act.length}`:""}</button>
      ${act.length? act.map(v=>`<button class="chip" data-a="filters">${esc(v)}</button>`).join("") : `<span class="chip static sub">Matching your preferences</span>`}
    </div></div>`;
  return head+`<div class="body">${S.mode==="swipe"?swipeBody():feedBody()}</div>`+nav("home");
},
detail(){
  const d=dish(S.detailId); if(!d) return V.home();
  const total=d.up+d.down, pct=Math.round(d.up/total*100), r=restoInfo(d.restaurant);
  const all=[...(d.note?[{u:d.by.n,t:d.note,ago:d.posted}]:[]),...d.comments];
  return `<div class="top"><div class="row"><button class="back" data-a="back">← Back</button><button class="heart ${d.liked?"on":""}" data-a="like" data-id="${d.id}">♥ ${d.likes}</button></div></div>
  <div class="body">
    ${S.justLiked?`<div class="banner">♥ Saved to your list. Here's where to get it.</div>`:""}
    <div class="ph"><span class="emoji">${d.emoji}</span><span class="lbl">student photo</span></div>
    <div class="row"><h2 style="font-size:21px">${esc(d.name)}</h2><span class="price">${money(d.price)}</span></div>
    <div class="chips">${d.tags.map(t=>`<span class="chip static">${esc(t)}</span>`).join("")}</div>
    ${d.diet.length||d.allergens.length?`<p class="sub">${d.diet.length?"Fits: "+d.diet.join(", "):""}${d.diet.length&&d.allergens.length?" · ":""}${d.allergens.length?"Contains: "+d.allergens.join(", "):""}</p>`:""}

    <div class="section"><h4>Would you recommend it too?</h4>
      <div class="bar" aria-label="${pct}% agree"><i style="width:${pct}%"></i></div>
      <span class="sub"><b class="mono">${pct}%</b> of ${total} students agree</span>
      <div class="vote"><button class="${d.vote==="up"?"on":""}" data-a="vote" data-v="up">👍 Agree · ${d.up}</button><button class="${d.vote==="down"?"on":""}" data-a="vote" data-v="down">👎 Disagree · ${d.down}</button></div>
    </div>

    <div class="section"><h4>Restaurant</h4>
      <button class="list-item" data-a="resto" data-v="${esc(d.restaurant)}"><span class="e">🏪</span><span class="grow"><b>${esc(d.restaurant)}</b><span class="sub">${esc(d.cuisine)} · ${esc(d.plaza)} · <span class="mono">${d.dist} mi</span></span><span class="sub">Open today ${r.hours}</span></span><span class="go" aria-hidden="true">›</span></button>
      <div class="btnrow"><button class="btn small" data-a="directions">↗ Get directions</button><button class="btn small ${d.tried?"":"primary"}" data-a="tried">${d.tried?"✓ Tried it":"I tried it"}</button></div>
    </div>

    <div class="section"><h4>Other popular dishes here</h4>
      ${S.dishes.filter(x=>x.restaurant===d.restaurant && x.id!==d.id).slice(0,3).map(x=>`<button class="list-item" data-a="open" data-id="${x.id}"><span class="e">${x.emoji}</span><span class="grow"><b>${esc(x.name)}</b><span class="sub">${money(x.price)} · ♥ ${x.likes}</span></span><span class="go">›</span></button>`).join("")||`<p class="sub">No other recommendations yet.</p>`}</div>
    <div class="section"><h4>Comments (${all.length})</h4>
      ${all.map(c=>`<div class="cmt"><div class="row"><b>${esc(c.u)}</b><span class="fine">${esc(c.ago)}</span></div><span>${esc(c.t)}</span></div>`).join("")||`<p class="sub">No comments yet. Be the first.</p>`}
      <form class="cmt-form" data-form="comment"><input type="text" id="cmt" placeholder="Say what you ordered…" aria-label="Comment"><button class="btn small primary">Post</button></form>
    </div>
  </div>`;
},
resto(){
  const name=S.resto, r=restoInfo(name);
  const list=S.dishes.filter(d=>d.restaurant===name).sort((a,b)=>b.likes-a.likes), d0=list[0];
  return `<div class="top"><div class="row"><button class="back" data-a="back">← Back</button><span class="sub">Restaurant</span></div></div>
  <div class="body">
    <div class="ph" style="aspect-ratio:16/9"><span class="emoji">🏪</span><span class="lbl">storefront photo</span></div>
    <div style="display:grid;gap:3px"><h2 style="font-size:22px">${esc(name)}</h2>
      <span class="sub">${esc(d0.cuisine)} · <span class="mono">${r.lvl}</span> · ${esc(d0.plaza)} · <span class="mono">${d0.dist} mi</span> from campus</span>
      <span class="sub">Open today ${r.hours}</span></div>
    <p>${esc(r.about)}</p>
    <div class="map">${mapSvg(d0)}</div>
    <button class="btn small" data-a="directions">↗ Get directions</button>
    <div class="section"><h4>Recommended dishes here (${list.length})</h4>
      ${list.map(x=>`<button class="list-item" data-a="open" data-id="${x.id}"><span class="e">${x.emoji}</span><span class="grow"><b>${esc(x.name)}</b><span class="sub"><span class="mono">${money(x.price)}</span> · ♥ ${x.likes} · rec'd by ${esc(x.by.n)}</span></span><span class="go" aria-hidden="true">›</span></button>`).join("")}
    </div>
  </div>`;
},
post(){
  const dr=S.draft;
  return `<div class="top"><div class="top-row"><h2 class="h-hand" style="font-size:24px">Recommend a dish</h2></div></div>
  <form class="body" data-form="post" novalidate>
    <div class="ph" style="aspect-ratio:16/9">${dr.photo?`<span class="emoji">${dr.photo}</span><span class="lbl">your photo</span>`:`<span class="sub" style="background:var(--fill);padding:4px 8px;border-radius:6px">＋ Add a photo of the dish</span>`}</div>
    <div class="photo-pick" aria-label="Pick a sample photo">${PHOTOS.map(p=>`<button type="button" data-a="photo" data-v="${p}" aria-label="Sample photo ${p}">${p}</button>`).join("")}</div>
    <div class="field"><label for="p-name">Dish name *</label><input type="text" id="p-name" value="${esc(dr.name)}" placeholder="e.g. Spicy Tonkotsu Ramen"></div>
    <div class="field"><label for="p-rest">Restaurant *</label><input type="text" id="p-rest" value="${esc(dr.rest)}" placeholder="Search restaurants near UCI"></div>
    <div class="btnrow">
      <div class="field"><label for="p-price">Price ($)</label><input type="number" id="p-price" min="0" step="0.25" value="${esc(dr.price)}" placeholder="12"></div>
      <div class="field"><label for="p-cuisine">Cuisine</label><select id="p-cuisine"><option value="">Choose…</option>${[...CUISINES,"Other"].map(c=>`<option ${dr.cuisine===c?"selected":""}>${c}</option>`).join("")}</select></div>
    </div>
    <div class="field"><label for="p-note">Why should other Anteaters try it?</label><textarea id="p-note" placeholder="What to order, when to go, how authentic it is…">${esc(dr.note)}</textarea></div>
    ${S.postErr?`<p class="err">${esc(S.postErr)}</p>`:""}
    <button class="btn primary" type="submit">Post recommendation</button>
  </form>`+nav("post");
},
 saved(){
   const list=S.dishes.filter(d=>d.liked);
   const names=[...new Set(list.map(d=>d.restaurant))];
   return `<div class="top"><div class="top-row"><h2 class="h-hand" style="font-size:26px">Saved it · food to-do list</h2><span class="sub">${list.length} dishes</span></div></div>
   <div class="body">${list.length? names.map(name=>`<div class="saved-group"><h3>🏪 ${esc(name)}</h3>${list.filter(d=>d.restaurant===name).map(d=>`<button class="list-item" data-a="open" data-id="${d.id}"><span class="e">${d.emoji}</span><span class="grow"><b>${esc(d.name)}</b><span class="sub">${money(d.price)} · ${d.dist} mi</span></span><span class="status ${d.tried?"done":""}">${d.tried?"Tried ✓":"Want to try"}</span></button>`).join("")}</div>`).join("")
     : `<div class="empty"><span style="font-size:65px">🍊</span><h3>No saved bites yet.</h3><p>Tap Want it on a dish to build your delicious little to-do list.</p><button class="btn primary" data-a="go" data-v="home">Discover dishes</button></div>`}
   </div>`+nav("saved");
 },
profile(){
  const mine=S.dishes.filter(d=>d.mine).length, tried=S.dishes.filter(d=>d.tried).length;
  return `<div class="top"><div class="top-row"><h2 class="h-hand" style="font-size:24px">Me</h2></div></div>
  <div class="body">
    <div class="who"><span class="avatar" style="width:52px;height:52px;font-size:20px">P</span><div><b>Demo Anteater</b> <span class="from">sample account</span><div class="sub">demo@uci.edu</div></div></div>
    <div class="btnrow"><div class="cmt"><b>Posted</b><span class="mono">${mine}</span></div><div class="cmt"><b>Tried</b><span class="mono">${tried}</span></div></div>
    <div class="section"><h4>Your preferences</h4>
      ${[["Dietary Restrictions",[...S.prefs.diet]],["Allergies",[...S.prefs.allergies]],["Food Adventurousness",[S.prefs.adventure]]].map(([h,v])=>`<span class="sub">${h}</span><div class="chips">${v.map(t=>`<span class="chip static on">${esc(t)}</span>`).join("")}</div>`).join("")}      <button class="btn small" data-a="go" data-v="tags">Edit preferences</button></div>
    <div class="section"><h4>Prototype</h4><button class="btn small ghost" data-a="reset">Sign out and restart</button></div>
  </div>`+nav("profile");
},
};

function swipeBody(){
  const deck=visible().filter(d=>!S.swiped.has(d.id));
  if(!deck.length) return `<div class="empty"><span style="font-size:34px">🍽</span><p>You've seen every dish that fits your filters.</p><div class="btnrow"><button class="btn small" data-a="filters">Loosen filters</button><button class="btn small primary" data-a="restart">Start over</button></div></div>`;
  const card=(d,top)=>`<article class="card ${top?"top":"behind"}" data-id="${d.id}" ${top?'tabindex="0" aria-label="Dish card. Enter opens details; left and right arrow keys skip or save."':""}>
    <div class="ph"><span class="emoji">${d.emoji}</span><span class="stamp yes">WANT</span><span class="stamp no">SKIP</span><span class="lbl">dish photo</span></div>
    <div class="card-info">
      <div class="row"><h3>${esc(d.name)}</h3><span class="price">${money(d.price)}</span></div>
      <span class="why">${esc(why(d))}</span>
      <span class="sub"><span class="mono">${d.dist} mi</span> · ${esc(d.cuisine)} · ♥ ${d.likes} Anteaters</span>
      <span class="sub">📍 ${esc(d.restaurant)} · ${esc(d.plaza)}</span>
    </div></article>`;
  return `<div class="deck">${deck[1]?card(deck[1],false):""}${card(deck[0],true)}</div>
    <p class="hint">← Skip · Tap for details · Want it →</p>
    <div class="swipe-actions"><button class="btn" data-a="nope" aria-label="Skip">× Skip</button><button class="btn soft" data-a="viewtop" aria-label="View dish">View dish</button><button class="btn primary" data-a="yum" aria-label="Want it">♥ Want it</button></div>`;
}
function feedBody(){
  const list=visible();
  if(!list.length) return `<div class="empty"><p>No dishes match these filters.</p><button class="btn small primary" data-a="filters">Change filters</button></div>`;
  return list.map(d=>`<article class="post" data-a="open" data-id="${d.id}">
    <div class="who"><span class="avatar">${esc(d.by.n[0])}</span><div><b>${esc(d.by.n)}</b> <span class="from">from ${esc(d.by.from)}</span><div class="sub">${esc(d.by.yr)}</div></div></div>
    <div class="ph"><span class="emoji">${d.emoji}</span><span class="lbl">dish photo</span></div>
    <div class="row"><h3 style="font-size:17px">${esc(d.name)}</h3><span class="price">${money(d.price)}</span></div>
    <span class="sub">${esc(d.restaurant)} · <span class="mono">${d.dist} mi</span> from UCI · ${esc(d.cuisine)}</span>
    ${d.note?`<p class="quote">“${esc(d.note)}”</p>`:""}
    <div class="actions"><button class="heart ${d.liked?"on":""}" data-a="like" data-id="${d.id}" aria-label="Like">♥ ${d.likes}</button><span class="sub">💬 ${d.comments.length}</span><span class="go">See where →</span></div>
  </article>`).join("");
}
function mapSvg(d){
  const x=60+Math.min(d.dist,5)*48, y=70-(d.id%4)*10;
  return `<svg viewBox="0 0 360 120" preserveAspectRatio="xMidYMid slice" aria-label="Map placeholder">
    <g stroke="var(--line)" stroke-width="1.5" fill="none"><path d="M0 40H360M0 88H360M80 0V120M200 0V120M300 0V120"/><path d="M0 120L150 0" stroke-dasharray="6 5"/></g>
    <circle cx="42" cy="64" r="16" fill="var(--screen)" stroke="var(--ink)" stroke-width="1.5"/><text x="42" y="68" text-anchor="middle" font-size="10" fill="var(--ink)" font-family="monospace">UCI</text>
    <path d="M58 64 L${x-10} ${y}" stroke="var(--ink)" stroke-width="2" stroke-dasharray="3 4" fill="none"/>
    <circle cx="${x}" cy="${y}" r="9" fill="var(--gold)" stroke="var(--ink)" stroke-width="2"/>
    <text x="${Math.min(x,300)}" y="${y+26}" text-anchor="middle" font-size="11" fill="var(--ink)" font-family="monospace">${d.dist} mi</text></svg>`;
}

/* ---------- filter sheet ---------- */
function openFilters(){
  const f=S.filters, el=$("#sheet");
  el.innerHTML=`<div class="scrim" data-a="closeSheet"><div class="sheet" role="dialog" aria-label="Filters">
    <div class="row"><h2 class="h-hand" style="font-size:24px">Filters</h2><button class="back" data-a="closeSheet" aria-label="Close filters">✕</button></div>
    ${FILTERS.map(g=>prefGroup(g.k,g.t,g.one?"Pick one":"Select any",g.opts,o=>f[g.k].has(o),"filt")).join("")}
    <div class="btnrow sheet-foot"><button class="btn" data-a="clearFilters">Clear all</button><button class="btn primary" data-a="closeSheet">Show <span id="f-count">${visible().length}</span> dishes</button></div>
  </div></div>`;
  el.hidden=false;
}

/* ---------- notes panel ---------- */
const NOTES = {
  signin:{step:-1,h:"Sign in with Google or any email",p:"Most students use Gmail, so Google is a one-tap shortcut at the top. Any other email address works too. Sign-in should take seconds, because people open the app when they're already hungry.",q:"Is Google or email the more natural way in?"},
  tags:{step:-1,h:"First login: food preferences",p:"The only onboarding step, then straight to the cards. Dietary restrictions and allergy choices filter the sample data, but are not sufficient to determine real-world food safety. Food adventurousness decides whether familiar favorites or new things show up first.",q:"Do students want dietary and allergy info up front, or would it feel like too much at sign-up?"},
  "home-swipe":{step:0,h:"Discover by swiping",p:"Dating-app style. Cards are picked from the student's preferences by default. Cards show each dish, price, distance and restaurant. The View Dish button opens details without saving. Left skips; right saves the dish and continues browsing, without forcing a detail-page redirect. The Filters button narrows by cuisine, food type, flavor, budget, distance, scene and eating custom.",q:"Is a dish photo plus price and distance enough to decide? Do people miss knowing the restaurant?"},
  "home-feed":{step:0,h:"Discover by scrolling the feed",p:"The Product Concept version: a feed of student posts. Each shows the dish, price, restaurant, distance and who recommended it. Hearting saves the dish; tapping opens details. The same Filters sheet applies here.",q:"Compared to Swipe, does the feed feel more useful or more overwhelming?"},
  detail:{step:2,h:"Dish details",p:"Opened by tapping a card or swiping right. Shows the dish, community agree/disagree votes, the restaurant, and one comment thread (the recommender's note comes first). Each comment only shows who wrote it and when.",q:"Is the dish page enough to decide, or do people jump straight to the restaurant?"},
  resto:{step:2,h:"Find the place: restaurant page",p:"Tapping the restaurant on a dish page opens this: hours, price level, a short intro, the map, and every dish students have recommended here.",q:"Do students use this page to pick a second dish, or just to get directions?"},
  saved:{step:3,h:"Saved list: the “try it” step",p:"Everything the user liked, with a status so they remember where to go. Marking “I tried it” on a dish leads straight into recommending it.",q:"Would students come back to this list when they're hungry?"},
  post:{step:4,h:"Recommend a dish",p:"Closing the loop: after eating, the student posts the dish with a photo, restaurant, price and a short note. It goes to the top of everyone's feed and deck.",q:"Is posting quick enough that people would do it right after a meal?"},
  profile:{step:-1,h:"Profile and preferences",p:"Shows the student's dietary restrictions, allergies and adventurousness, which they can edit at any time.",q:"What else would you expect to find here?"},
};
const LOOP=["Browse Dishes","Express Interest","Save or View Details","Continue Discovering"];
const TASKS=[["spicy","Find a spicy dish under $15 and open its details"],["find","Get directions to a restaurant (simulated)"],["comment","Leave a comment on a dish"],["post","Post a dish you've tried"],["both","Use both Swipe and Feed, then say which you prefer"]];
function renderNotes(){
  const key=S.screen==="home"?"home-"+S.mode:S.screen, n=NOTES[key];
  let step=n.step; if(S.screen==="detail"&&S.justLiked) step=1;
  $("#loop").innerHTML=LOOP.map((l,i)=>`<span class="${i===step||(S.screen==="detail"&&!S.justLiked&&i===2)?"on":""}">${l}</span>`).join("<em>→</em>");
  $("#note").innerHTML=`<h2>${n.h}</h2><p>${n.p}</p><p class="q">Testing: ${n.q}</p>`;
  $("#tasks").innerHTML=TASKS.map(([k,t])=>`<div class="task ${S.tasks[k]?"done":""}"><span class="box">${S.tasks[k]?"✓":""}</span><span>${t}</span></div>`).join("");
}

/* ---------- render + actions ---------- */
function render(){
  if(S.screen==="home") S.usedModes.add(S.mode);
  if(S.usedModes.size===2) S.tasks.both=true;
  $("#app").innerHTML=V[S.screen]();
  renderNotes();
  if(S.screen==="home"&&S.mode==="swipe") bindSwipe();
}
let toastT;
function toast(msg){const t=$("#toast");t.textContent=msg;t.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>t.hidden=true,2200);}
/* in-app back stack for detail and restaurant pages; bottom-nav jumps clear it */
function pushHist(){S.hist.push({screen:S.screen,detailId:S.detailId,resto:S.resto,justLiked:S.justLiked});}
function openResto(name){pushHist();S.resto=name;S.screen="resto";render();$(".body")?.scrollTo(0,0);}
function openDetail(id,liked=false){
  pushHist();
  S.detailId=id; S.justLiked=liked; S.screen="detail";
  const d=dish(id); if(d.flavor.includes("Spicy")&&d.price<=15) S.tasks.spicy=true;
  render(); $(".body")?.scrollTo(0,0);
}
function like(d,force){
  const on=force??!d.liked; if(on!==d.liked){d.liked=on;d.likes+=on?1:-1;}
}
function swipe(dir){
  const card=$(".card.top"); if(!card) return;
  const id=+card.dataset.id;
  card.style.transition="transform .25s ease";
  card.style.transform=`translateX(${dir==="right"?420:-420}px) rotate(${dir==="right"?18:-18}deg)`;
  setTimeout(()=>{
    S.swiped.add(id);
    if(dir==="right"){
      const d=dish(id);like(d,true);render();
      toast(`Added to your food list ✓ · ${d.restaurant} · keep exploring`);
    }else render();
  },230);
}
function bindSwipe(){
  const card=$(".card.top"); if(!card) return;
  const yes=card.querySelector(".stamp.yes"), no=card.querySelector(".stamp.no");
  let x0=null,dx=0;
  card.addEventListener("pointerdown",e=>{x0=e.clientX;dx=0;card.setPointerCapture(e.pointerId);card.style.transition="none";});
  card.addEventListener("pointermove",e=>{if(x0===null)return;dx=e.clientX-x0;card.style.transform=`translateX(${dx}px) rotate(${dx/18}deg)`;yes.style.opacity=Math.max(0,dx/90);no.style.opacity=Math.max(0,-dx/90);});
  const end=()=>{if(x0===null)return;x0=null;
    if(dx>90)swipe("right");else if(dx<-90)swipe("left");
    else{card.style.transition="";card.style.transform="";yes.style.opacity=0;no.style.opacity=0;
      if(Math.abs(dx)<6){const id=+card.dataset.id;setTimeout(()=>openDetail(id),0);}}};
  card.addEventListener("pointerup",end);card.addEventListener("pointercancel",()=>{dx=0;end();});
  card.addEventListener("keydown",e=>{if(e.key==="ArrowRight")swipe("right");if(e.key==="ArrowLeft")swipe("left");if(e.key==="Enter")openDetail(+card.dataset.id);});
}

const A = {
  signin(){S.screen=S.onboarded?"home":"tags";render();},
  go(v){S.hist=[];S.screen=v;S.postErr="";render();$(".body")?.scrollTo(0,0);},
  pref(v,el){
    const k=el.dataset.k, p=S.prefs;
    if(k==="adventure") p.adventure=v;
    else{
      const s=p[k], none=NONE[k];
      if(v===none){s.clear();s.add(none);}
      else{s.delete(none);s.has(v)?s.delete(v):s.add(v);if(!s.size)s.add(none);}
    }
    el.parentElement.querySelectorAll(".chip").forEach(c=>{
      const on=k==="adventure"? p.adventure===c.dataset.v : p[k].has(c.dataset.v);
      c.classList.toggle("on",on); c.setAttribute("aria-pressed",on);
    });
  },
  start(){S.swiped.clear();S.mode=S.onboarded?S.mode:"swipe";const first=!S.onboarded;S.onboarded=true;S.screen="home";render();if(first)toast("Swipe right on anything that looks good");},
  mode(v){S.mode=v;render();},
  nope(){swipe("left");}, yum(){swipe("right");},
  viewtop(){const el=$(".card.top");if(el)openDetail(+el.dataset.id);},
  restart(){S.swiped.clear();render();},
  open(_,el){openDetail(+el.dataset.id);},
  like(_,el){const d=dish(+el.dataset.id);like(d);render();if(d.liked)toast("Saved to your Want to try list");},
  back(){const h=S.hist.pop()||{screen:"home"};Object.assign(S,{detailId:null,resto:null,justLiked:false},h);render();},
  resto(v){openResto(v);},
  vote(v){const d=dish(S.detailId);if(d.vote===v){d[v]--;d.vote=null;}else{if(d.vote)d[d.vote]--;d[v]++;d.vote=v;}render();},
  directions(){S.tasks.find=true;renderNotes();toast("Opening Maps… (not part of this prototype)");},
  tried(){const d=dish(S.detailId);if(d.tried)return;d.tried=true;like(d,true);
    S.draft={...S.draft,name:d.name,rest:d.restaurant,price:String(d.price),cuisine:d.cuisine};
    toast("Nice! Tell other Anteaters how it was");S.hist=[];S.screen="post";render();},
  photo(v){S.draft.photo=v;render();},
  filters(){openFilters();},
  closeSheet(_,el,e){if(e.target!==el&&el.classList.contains("scrim"))return;$("#sheet").hidden=true;render();},
  filt(v,el){
    const g=FILTERS.find(x=>x.k===el.dataset.k), s=S.filters[g.k], had=s.has(v);
    if(g.one) s.clear();
    had?s.delete(v):s.add(v);
    el.parentElement.querySelectorAll(".chip").forEach(c=>{const on=s.has(c.dataset.v);c.classList.toggle("on",on);c.setAttribute("aria-pressed",on);});
    S.swiped.clear();$("#f-count").textContent=visible().length;
  },
  clearFilters(){S.filters=noFilters();S.swiped.clear();const y=$(".sheet").scrollTop;openFilters();$(".sheet").scrollTop=y;},
  reset(){fresh();render();},
};

document.addEventListener("click",e=>{
  const el=e.target.closest("[data-a]"); if(!el) return;
  const a=el.dataset.a; if(!A[a]) return;
  if(el.tagName==="BUTTON") e.preventDefault();
  e.stopPropagation();
  A[a](el.dataset.v,el,e);
});
document.addEventListener("input",e=>{
  const t=e.target, id=t.id;
  const map={"p-name":"name","p-rest":"rest","p-price":"price","p-cuisine":"cuisine","p-note":"note"};
  if(map[id]) S.draft[map[id]]=t.value;
});
document.addEventListener("submit",e=>{
  e.preventDefault();
  const form=e.target.dataset.form;
  if(form==="login"){
    const ok=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($("#login-email").value.trim());
    $("#login-err").hidden=ok; if(ok) A.signin();
  }
  if(form==="comment"){
    const v=$("#cmt").value.trim(); if(!v) return;
    dish(S.detailId).comments.push({u:"You",t:v,ago:"Just now"}); S.tasks.comment=true; render(); toast("Comment posted");
  }
  if(form==="post"){
    const dr=S.draft;
    if(!dr.name.trim()||!dr.rest.trim()){S.postErr="Add the dish name and restaurant so others can find it.";render();return;}
    const known=S.dishes.find(d=>d.restaurant.toLowerCase()===dr.rest.trim().toLowerCase());
    S.dishes.unshift({id:S.nextId++,mine:true,name:dr.name.trim(),emoji:dr.photo||"🍽️",restaurant:dr.rest.trim(),plaza:known?known.plaza:"Near campus",
      price:+dr.price||10,dist:known?known.dist:1,cuisine:dr.cuisine||"Other",type:"Other",tags:["New"],diet:[],allergens:[],fam:2,flavor:[],scene:[],custom:[],likes:1,up:1,down:0,liked:true,tried:true,vote:"up",
      by:{n:"Demo Anteater (you)",from:"UCI",yr:"sample account"},posted:"Just now",note:dr.note.trim(),comments:[]});
    S.draft={name:"",rest:"",price:"",cuisine:"",note:"",photo:null}; S.postErr="";
    S.tasks.post=true; S.mode="feed"; S.screen="home"; render(); $(".body")?.scrollTo(0,0);
    toast("Posted! Your dish is at the top of the feed");
  }
});
$("#resetAll").addEventListener("click",()=>{fresh();render();});
render();
