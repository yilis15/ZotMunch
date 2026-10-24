// Unified composer. Shared dish tags never change personal food preferences.
const tagCategories = {
 Dietary:['Vegetarian','Vegan','Halal','Kosher','Gluten-free','Dairy-free'],
 Allergens:['Milk','Eggs','Fish','Shellfish','Peanuts','Tree nuts','Wheat','Soy','Sesame'],
 Cuisine:['Japanese','Taiwanese','Mexican','Vietnamese','Korean','Hawaiian','Middle Eastern','Italian','Chinese','Indian','Filipino','Thai'],
 'Food type':['Rice','Noodles','Hot pot','Dumplings','Tacos','Pizza','Sandwich','Dessert','Drinks'],
 Flavor:['Spicy','Sweet','Sour','Savory','Light & Fresh'],
 Scene:['Breakfast','Lunch','Dinner','Late night','Study break'],
 'Dining options':['Dine-in','Takeout','Delivery','Outdoor seating']
};
const composer = {editId:null, tags:[], tagDraft:[], tagFrom:'post', scroll:0, reviewFrom:'detail', lastDish:null};
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function saveLocal(key,value) {
 try { persist(key,value); return true; }
 catch { toast('Storage is full. Remove some photos and try again.'); return false; }
}
function priceInCents(value) {
 if (!/^\d+(\.\d{1,2})?$/.test(value.trim())) return null;
 const [whole,fraction='']=value.trim().split('.');
 const cents=Number(whole)*100+Number(fraction.padEnd(2,'0'));
 return Number.isSafeInteger(cents) ? cents : null;
}
function dishTags(id) {return read('dishTags',{})[id] || (id==='tofu'?['Spicy']:[]);}
function captureComposer() {
 return {editId:composer.editId,name:$('postDishName').value,restaurant:$('postRestaurant').value,branch:state.postRestaurantBranch,price:$('postPrice').value,body:$('postReviewText').value,tags:[...composer.tags],photos:state.postPhotos.map(p=>({url:p.url})),dismissed:state.postMatchDismissed};
}
function rememberDraft() { return saveLocal('composerDraft',captureComposer()); }
function paintComposer(data={}) {
 composer.editId=data.editId || null; composer.tags=[...(data.tags||[])];
 $('postForm').reset(); $('postDishName').value=data.name||''; $('postRestaurant').value=data.restaurant||'';
 $('postPrice').value=data.price??''; $('postReviewText').value=data.body||'';
 state.postRestaurantBranch=data.branch||null; state.postPhotos=data.photos||[]; state.postMatch=null; state.postMatchDismissed=data.dismissed||'';
 $('postRestaurantSuggestions').hidden=true; $('composerError').hidden=true;
 document.querySelector('#post .post-header h2').textContent=composer.editId?'Edit post':data.name?'Edit draft':'Share a bite';
 $('composerSubmit').textContent=composer.editId?'Save changes':'Publish post';
 renderPostPhotoPreviews(); paintBranch(); paintTagSummary(); showPage('post');
}
startPost = function(){paintComposer(read('composerDraft',{})||{});};
function paintBranch() {
 let el=$('selectedPostBranch');
 if(!el){el=document.createElement('div');el.id='selectedPostBranch';$('postRestaurantSuggestions').after(el);}
 const branch=state.postRestaurantBranch;
 el.hidden=!branch;
 el.textContent=branch?`⌖  ${branch.restaurant} · ${branch.location}\n${branch.address}`:'';
}
function paintTagSummary(){ $('composerTagSummary').textContent=composer.tags.join(' · '); }
findPostDishMatch = function(){
 const b=state.postRestaurantBranch; if(!b)return null;
 return dishes.find(d=>d.id!==composer.editId && normalized(d.name)===normalized($('postDishName').value) && normalized(d.restaurant)===normalized(b.restaurant) && normalized(d.location)===normalized(b.location) && (!d.address||normalized(d.address)===normalized(b.address)))||null;
};
const oldMatchCheck=checkPostDishMatch;
checkPostDishMatch=function(){
 const match=findPostDishMatch();
 if(match){$('postMatchPhoto').src=match.image||'assets/mascots/cookie.png';$('postMatchPhoto').alt=match.name;}
 return oldMatchCheck();
};
const oldSelectBranch=selectPostRestaurant;
selectPostRestaurant=function(button){oldSelectBranch(button);paintBranch();rememberDraft();};
function openTags(from){
 composer.tagFrom=from; composer.scroll=document.querySelector(`#${from} .scroller`).scrollTop;
 composer.tagDraft=[...(from==='review'?dishTags(state.detailId):composer.tags)];
 paintTags();showPage('dishTags');
}
function paintTags(){
 $('tagCommit').textContent=composer.tagFrom==='review'?'Save tags':'Done';
 $('dishTagGroups').innerHTML=Object.entries(tagCategories).map(([group,values])=>`<section class="post-tag-group"><div class="field-heading"><h3>${group}</h3><small class="muted">Select all that apply</small></div><div class="post-tag-chips">${values.map(t=>`<button type="button" class="post-tag-chip${composer.tagDraft.includes(t)?' selected':''}" data-action="dishTag" data-tag="${escapeHTML(t)}" aria-pressed="${composer.tagDraft.includes(t)}">${escapeHTML(t)}</button>`).join('')}</div></section>`).join('');
}
function returnFromTags(commit){
 if(commit){
  if(composer.tagFrom==='review'){
   const all=read('dishTags',{});all[state.detailId]=[...composer.tagDraft];if(!saveLocal('dishTags',all))return;
  } else {composer.tags=[...composer.tagDraft];paintTagSummary();rememberDraft();}
 }
 if(composer.tagFrom==='review'){
  // showPage('review') resets form fields in the base renderer; bypass that reset.
  document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id==='review'));state.page='review';paintReviewTags();
 }else showPage('post');
 document.querySelector(`#${composer.tagFrom} .scroller`).scrollTop=composer.scroll;
}
function paintReviewTags(){document.querySelector('.review-spice').textContent=dishTags(state.detailId).join(' · ')||'Tags unknown';}
renderReview=function(){
 const d=dishes.find(d=>d.id===state.detailId);if(!d)return;
 $('reviewDishName').textContent=d.name;setDishPhoto($('reviewDishPhoto'),d);
 $('reviewDishRestaurant').textContent=`${d.restaurant} · ${d.location}`;
 renderReviewStars();paintReviewTags();renderReviewPhotoPreviews();
};
showReview=function(){
 if(!state.detailId)return;
 composer.reviewFrom='detail';state.reviewRating=0;state.reviewPhotos=[];$('reviewText').value='';showPage('review');
};
function addReviewFromPost(){
 const match=state.postMatch;if(!match)return;
 rememberDraft();state.detailId=match.id;composer.reviewFrom='post';state.reviewRating=0;
 state.reviewPhotos=state.postPhotos.map(p=>({url:p.url}));$('reviewText').value=$('postReviewText').value;showPage('review');
}
function publishComposer(event){
 event.preventDefault();
 const cents=priceInCents($('postPrice').value),name=$('postDishName').value.trim(),branch=state.postRestaurantBranch;
 let error=!name?'Enter a dish name.':!branch?'Choose the exact restaurant branch.':cents===null?'Enter a nonnegative USD price with no more than 2 decimal places.':'';
 $('composerError').hidden=!error;$('composerError').textContent=error;
 if(error){$('composerError').scrollIntoView({block:'center'});return;}
 if(checkPostDishMatch())return;
 const id=composer.editId||`post-${Date.now()}`;
 const prior=read('posts',[]).find(p=>p.id===id);
 const post={id,dishId:id,dishName:name,restaurant:branch.restaurant,location:branch.location,address:branch.address,price:cents/100,priceCents:cents,body:$('postReviewText').value.trim(),tags:[...composer.tags],photos:state.postPhotos.map(p=>p.url),createdAt:prior?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};
 const posts=read('posts',[]).filter(p=>p.id!==id);posts.unshift(post);
 if(!saveLocal('posts',posts))return;
 hydratePostedDish(post);
 // Post tags are committed only when its form is submitted successfully.
 const tags=read('dishTags',{});tags[id]=[...post.tags];saveLocal('dishTags',tags);
 localStorage.removeItem('zm_composerDraft');composer.lastDish=id;state.postMatch=dishes.find(d=>d.id===id);
 showPage('postSuccess');toast(prior?'Changes saved.':'Your bite is published.');
}
function hydratePostedDish(p){
 const data={id:p.id,name:p.dishName,restaurant:p.restaurant,location:p.location,address:p.address,price:p.priceCents!==undefined?p.priceCents/100:p.price,distance:0,kind:'Community',desc:p.body,image:p.photos?.[0],tags:p.tags||[],cuisine:p.tags?.find(t=>tagCategories.Cuisine.includes(t)),foodType:p.tags?.find(t=>tagCategories['Food type'].includes(t)),flavor:p.tags?.find(t=>tagCategories.Flavor.includes(t))};
 const index=dishes.findIndex(d=>d.id===p.id);if(index<0)dishes.unshift(data);else Object.assign(dishes[index],data);
}
function editPost(id){
 const p=read('posts',[]).find(p=>p.id===id);if(!p)return;
 paintComposer({editId:p.id,name:p.dishName,restaurant:p.restaurant,branch:{restaurant:p.restaurant,location:p.location,address:p.address},price:(p.priceCents!==undefined?p.priceCents/100:p.price).toFixed(2),body:p.body,tags:p.tags,photos:(p.photos||[]).map(url=>({url}))});
}
function renderOwnPosts(){
 const posts=read('posts',[]);
 $('postedBites').innerHTML=posts.length?posts.map(p=>`<article class="own-post"><button class="own-post-open" data-action="openOwnDish" data-id="${escapeHTML(p.id)}">${p.photos?.[0]?`<img src="${escapeHTML(p.photos[0])}" alt="${escapeHTML(p.dishName)}">`:''}<h2>${escapeHTML(p.dishName)}</h2><p class="muted small">${escapeHTML(p.restaurant)} · ${escapeHTML(p.location)}</p></button><footer><span class="muted small">Posted ${new Date(p.createdAt).toLocaleDateString('en-US')}</span><button class="btn blue" data-action="editOwnPost" data-id="${escapeHTML(p.id)}">Edit post</button></footer></article>`).join(''):'<p class="panel">No posted bites yet. Share your first bite from Post.</p>';
 $('journalPosts').innerHTML=posts.slice(0,1).map(p=>`<button class="journal-link" data-action="editOwnPost" data-id="${escapeHTML(p.id)}">${escapeHTML(p.dishName)}<span>Edit post　›</span></button>`).join('')||'<p class="muted small">Your shared bites will appear here.</p>';
}
function renderOwnReviews(){
 const reviews=read('reviews',{});
 $('ownReviews').replaceChildren();
 Object.entries(reviews).forEach(([id,list])=>list.forEach(r=>{
 const d=dishes.find(d=>d.id===id);const card=document.createElement('article');card.className='panel';
 const title=document.createElement('h2');title.textContent=d?.name||'Dish';
 const body=document.createElement('p');body.textContent=`${'★'.repeat(r.rating||0)} ${r.body||''}`;
 card.append(title,body);(r.photos||[]).forEach(url=>{const img=document.createElement('img');img.src=url;img.alt='Your review photo';img.className='published-review-photo';card.append(img);});$('ownReviews').append(card);
 }));
 if(!$('ownReviews').childElementCount)$('ownReviews').textContent='No reviews yet. Your honest experiences will appear here.';
}
function submitReview(event){
 event.preventDefault();if(!state.reviewRating){toast('Please select a star rating first.');return;}
 const all=read('reviews',{});const list=all[state.detailId]||[];
 list.push({rating:state.reviewRating,body:$('reviewText').value.trim(),photos:state.reviewPhotos.map(p=>p.url),createdAt:new Date().toISOString()});all[state.detailId]=list;
 if(!saveLocal('reviews',all))return;
 if(composer.reviewFrom==='post')localStorage.removeItem('zm_composerDraft');
 renderDetailReview(state.detailId);showPage('detail');detailReturnPage=composer.reviewFrom==='post'?'discover':detailReturnPage;toast('Thanks! Your review has been posted.');
}
const baseDetailReview=renderDetailReview;
renderDetailReview=function(id){
 baseDetailReview(id);
 let gallery=$('detailReviewPhotos');if(!gallery){gallery=document.createElement('div');gallery.id='detailReviewPhotos';document.querySelector('.detail-reviews').append(gallery);}
 gallery.replaceChildren();const list=read('reviews',{})[id]||[];
 for(const url of list.at(-1)?.photos||[]){const img=document.createElement('img');img.src=url;img.alt='Community review photo';img.className='published-review-photo';gallery.append(img);}
};
// Convert photos to bounded data URLs so draft and published images survive reload.
async function durablePhoto(file){
 if(!file.type.startsWith('image/'))throw Error('Choose an image file.');
 if(file.size>12*1024*1024)throw Error('Each source image must be under 12 MB.');
 const url=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file);});
 const img=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(Error('This image format could not be read.'));i.src=url;});
 const canvas=document.createElement('canvas'),scale=Math.min(1,1200/Math.max(img.width,img.height));canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
 return {url:canvas.toDataURL('image/jpeg',0.8)};
}
let pendingPhotoCount=0;
document.addEventListener('change',async e=>{
 if(!['postPhotosInput','reviewPhotosInput'].includes(e.target.id))return;
 e.stopImmediatePropagation();const review=e.target.id==='reviewPhotosInput',key=review?'reviewPhotos':'postPhotos';const files=[...e.target.files];e.target.value='';pendingPhotoCount++;
 $('composerSubmit').disabled=true;document.querySelector('.review-submit').disabled=true;
 try{for(const file of files){if(state[key].length>=4){toast('Up to 4 photos per post or review.');break;}state[key].push(await durablePhoto(file));}if(review)renderReviewPhotoPreviews();else{renderPostPhotoPreviews();rememberDraft();}}
 catch(err){toast(err.message||'Unable to read this photo.');}finally{pendingPhotoCount--;if(!pendingPhotoCount){$('composerSubmit').disabled=false;document.querySelector('.review-submit').disabled=false;}}
},true);
// Capture replaces only the old two-step composer and tag placeholder actions.
document.addEventListener('submit',e=>{
 if(e.target.id==='postForm'||e.target.id==='reviewForm'){
 e.preventDefault();e.stopImmediatePropagation();if(pendingPhotoCount){toast('Wait for photos to finish loading.');return;}
 if(e.target.id==='postForm')publishComposer(e);else submitReview(e);
 }
},true);
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-action]');if(!b)return;
 const a=b.dataset.action;const actions={
 composerTags:()=>openTags('post'),reviewEditTags:()=>openTags('review'),
 dishTag:()=>{const t=b.dataset.tag;composer.tagDraft=composer.tagDraft.includes(t)?composer.tagDraft.filter(v=>v!==t):[...composer.tagDraft,t];paintTags();},
 cancelDishTags:()=>returnFromTags(false),commitDishTags:()=>returnFromTags(true),
 storeDraft:()=>{if(rememberDraft()){showPage('me');renderOwnPosts();toast('Draft saved.');}},
 backFromPost:()=>{if(rememberDraft())showPage('discover');},
 addMyReview:addReviewFromPost,
 backFromReview:()=>{showPage(composer.reviewFrom==='post'?'post':'detail');},
 myPosts:()=>{renderOwnPosts();showPage('myPosts');},myReviews:()=>{renderOwnReviews();showPage('myReviews');},
 resumeDraft:()=>paintComposer(read('composerDraft',{})||{}),
 editOwnPost:()=>editPost(b.dataset.id),journalBack:()=>{showPage('me');renderOwnPosts();},
 openOwnDish:()=>showDetail(b.dataset.id),
 viewMyPost:()=>{if(composer.lastDish)showDetail(composer.lastDish);},
 backToDiscover:()=>showPage('discover')
 };
 if(actions[a]){e.preventDefault();e.stopImmediatePropagation();actions[a]();}
 else if(a==='nav'&&b.dataset.page==='me')setTimeout(renderOwnPosts,0);
},true);
$('postForm').addEventListener('input',()=>{paintBranch();rememberDraft();});
for(const p of read('posts',[]))hydratePostedDish(p);
renderOwnPosts();
// Accessible returns and rating keyboard controls.
document.addEventListener('keydown',e=>{
 if(e.key==='Escape' && state.page==='dishTags'){e.preventDefault();returnFromTags(false);return;}
 const dialog=$('postMatchOverlay');
 if(dialog.classList.contains('show')){
  if(e.key==='Escape'){e.preventDefault();document.querySelector('[data-action="closePostMatch"]').click();$('postDishName').focus();}
  if(e.key==='Tab'){
   const buttons=[...dialog.querySelectorAll('button')];const first=buttons[0],last=buttons.at(-1);
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  }
 }
 if(e.target.matches('[data-action="rateReview"]')&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){
  e.preventDefault();const delta=['ArrowLeft','ArrowDown'].includes(e.key)?-1:1;
  state.reviewRating=Math.max(1,Math.min(5,Number(e.target.dataset.rating)+delta));renderReviewStars();document.querySelector(`[data-action="rateReview"][data-rating="${state.reviewRating}"]`).focus();
 }
});
const matchWithPhoto=checkPostDishMatch;
checkPostDishMatch=function(){const shown=matchWithPhoto();if(shown)document.querySelector('[data-action="closePostMatch"]').focus();return shown;};
