import{r as o,j as e,R as Te,s as de}from"./index-BPK71jDm.js";import{c as g}from"./index-BYzbn2Io.js";const $e={fr:{dir:"ltr",title:"Gestion des catégories",subtitle:"Organisez vos catégories et sous-catégories de produits.",add:"Nouvelle catégorie",add_sub:"Nouvelle sous-catégorie",stat_total:"Total des catégories",records:r=>`${r} catégorie(s)`,stat_active:"Catégories actives",active_sub:"Visibles dans le catalogue",stat_subs:"Sous-catégories",subs_sub:"Rattachées aux catégories",tab_cats:"Catégories",tab_subs:"Sous-catégories",search_ph:"Rechercher...",filter_category:"Catégorie",all_categories:"Toutes les catégories",all_status:"Tous les statuts",status_active:"✓ Actifs uniquement",status_inactive:"✗ Inactifs uniquement",reset:"Réinitialiser",results_cats:r=>`${r} catégorie(s)`,results_subs:r=>`${r} sous-catégorie(s)`,th_name:"Nom",th_subs:"Sous-catégories",th_sub_name:"Sous-catégorie",th_parent:"Catégorie parente",th_status:"Statut",th_actions:"Actions",loading:"Chargement...",none:"Aucune catégorie trouvée.",none_subs:"Aucune sous-catégorie trouvée.",active:"Actif",inactive:"Inactif",no_subs:"Aucune",sub_count:r=>`${r} sous-catégorie(s)`,view_subs:"Voir les sous-catégories",edit:"Modifier",delete:"Supprimer",add_sub_title:"Ajouter une sous-catégorie",toggle_on:"Activer",toggle_off:"Désactiver",expand:"Développer",collapse:"Réduire",modal_edit_cat:"Modifier la catégorie",modal_new_cat:"Nouvelle catégorie",modal_edit_sub:"Modifier la sous-catégorie",modal_new_sub:"Nouvelle sous-catégorie",f_name_cat:"Nom de la catégorie",f_name_cat_ph:"Ex : Électronique",f_name_sub:"Nom de la sous-catégorie",f_name_sub_ph:"Ex : Téléphones",f_parent:"Catégorie parente",f_parent_ph:"Sélectionnez une catégorie",f_status:"Statut",cancel:"Annuler",save:"Enregistrer",saving:"Enregistrement...",delete_cat_title:"Supprimer cette catégorie ?",delete_sub_title:"Supprimer cette sous-catégorie ?",delete_warn:"Cette action est irréversible.",delete_sub_warn:r=>`${r} sous-catégorie(s) seront également supprimée(s).`,delete_confirm:"Oui, supprimer",deleting:"Suppression...",err_load:"Impossible de charger les catégories.",err_save:"Erreur lors de l'enregistrement.",err_delete:"Erreur lors de la suppression.",close:"Fermer",retry:"Réessayer",switch_title:"Changer de langue",role_admin:"Admin",role_manager:"Gérant",role_stock:"Stock",role_user:"Lecture",err_forbidden:"Action réservée à l’administrateur.",err_forbidden_add:"Vous n’avez pas le droit d’ajouter."},ar:{dir:"rtl",title:"إدارة الفئات",subtitle:"نظّم فئات منتجاتك وفئاتها الفرعية.",add:"فئة جديدة",add_sub:"فئة فرعية جديدة",stat_total:"إجمالي الفئات",records:r=>`${r} فئة`,stat_active:"الفئات النشطة",active_sub:"ظاهرة في الكتالوج",stat_subs:"الفئات الفرعية",subs_sub:"مرتبطة بالفئات",tab_cats:"الفئات",tab_subs:"الفئات الفرعية",search_ph:"بحث...",filter_category:"الفئة",all_categories:"كل الفئات",all_status:"كل الحالات",status_active:"✓ النشطة فقط",status_inactive:"✗ غير النشطة فقط",reset:"إعادة تعيين",results_cats:r=>`${r} فئة`,results_subs:r=>`${r} فئة فرعية`,th_name:"الاسم",th_subs:"الفئات الفرعية",th_sub_name:"الفئة الفرعية",th_parent:"الفئة الأم",th_status:"الحالة",th_actions:"إجراءات",loading:"جارٍ التحميل...",none:"لا توجد فئات.",none_subs:"لا توجد فئات فرعية.",active:"نشط",inactive:"غير نشط",no_subs:"لا يوجد",sub_count:r=>`${r} فئة فرعية`,view_subs:"عرض الفئات الفرعية",edit:"تعديل",delete:"حذف",add_sub_title:"إضافة فئة فرعية",toggle_on:"تنشيط",toggle_off:"إلغاء التنشيط",expand:"توسيع",collapse:"طيّ",modal_edit_cat:"تعديل الفئة",modal_new_cat:"فئة جديدة",modal_edit_sub:"تعديل الفئة الفرعية",modal_new_sub:"فئة فرعية جديدة",f_name_cat:"اسم الفئة",f_name_cat_ph:"مثال: إلكترونيات",f_name_sub:"اسم الفئة الفرعية",f_name_sub_ph:"مثال: هواتف",f_parent:"الفئة الأم",f_parent_ph:"اختر فئة",f_status:"الحالة",cancel:"إلغاء",save:"حفظ",saving:"جارٍ الحفظ...",delete_cat_title:"حذف هذه الفئة؟",delete_sub_title:"حذف هذه الفئة الفرعية؟",delete_warn:"لا يمكن التراجع عن هذا الإجراء.",delete_sub_warn:r=>`سيتم حذف ${r} فئة فرعية أيضًا.`,delete_confirm:"نعم، احذف",deleting:"جارٍ الحذف...",err_load:"تعذّر تحميل الفئات.",err_save:"حدث خطأ أثناء الحفظ.",err_delete:"حدث خطأ أثناء الحذف.",close:"إغلاق",retry:"إعادة المحاولة",switch_title:"تغيير اللغة",role_admin:"مدير",role_manager:"مدير",role_stock:"مخزن",role_user:"قراءة",err_forbidden:"هذا الإجراء مخصص لمدير النظام فقط.",err_forbidden_add:"ليس لديك صلاحية الإضافة."}},ce="gestistock_lang",ae=()=>({name:"",category_id:"",status:"active"}),pe=["blue","violet","green","amber","rose","teal"],ue=(r="")=>{let d=0;for(let S=0;S<r.length;S+=1)d=d*31+r.charCodeAt(S)>>>0;return pe[d%pe.length]},te=r=>String(r||"").trim().toLowerCase(),Fe=r=>["admin","administrateur","administrator"].includes(te(r)),Ie=({user:r})=>{const[d,S]=o.useState(()=>{try{return localStorage.getItem(ce)==="ar"?"ar":"fr"}catch{return"fr"}}),t=$e[d];o.useEffect(()=>{try{localStorage.setItem(ce,d)}catch{}},[d]);const[fe,se]=o.useState(r||null),[be,K]=o.useState(!r);o.useEffect(()=>{if(r){se(r),K(!1);return}let a=!0;return(async()=>{try{const{data:{session:n}}=await de.auth.getSession();if(!n?.user){a&&K(!1);return}const{data:l}=await de.from("profiles").select("role, status, name").eq("id",n.user.id).single();if(!a)return;se({id:n.user.id,email:n.user.email,name:l?.name||n.user.user_metadata?.name||n.user.email,role:te(l?.role||n.user.user_metadata?.role||"cashier"),status:l?.status||"active"})}catch{}a&&K(!1)})(),()=>{a=!1}},[r]);const j=te(fe?.role),I=Fe(j),C=I||j==="manager"||j==="stock",w=I||j==="manager"||j==="stock",z=I,ge=I?t.role_admin:j==="manager"?t.role_manager:j==="stock"?t.role_stock:t.role_user,[u,me]=o.useState([]),[re,oe]=o.useState(!0),[ne,p]=o.useState(""),[R,i]=o.useState(""),[G,T]=o.useState(!1),[Y,U]=o.useState(!1),[m,A]=o.useState("category"),[b,N]=o.useState(null),[E,k]=o.useState(null),[f,x]=o.useState(ae),[O,q]=o.useState(!1),[h,V]=o.useState("categories"),[W,H]=o.useState(""),[v,J]=o.useState("all"),[c,$]=o.useState("all"),[xe,he]=o.useState({}),F=async()=>{oe(!0),p("");try{const a=await g.getAll(),s=Array.isArray(a)?a:Array.isArray(a?.data)?a.data:a?.data?.data||[];me(s)}catch(a){console.error("Erreur chargement catégories:",a),p("err_load")}finally{oe(!1)}};o.useEffect(()=>{F()},[]);const _=()=>{T(!1),U(!1),i(""),N(null),k(null),x(ae())};o.useEffect(()=>{if(!G&&!Y)return;const a=s=>{s.key==="Escape"&&_()};return window.addEventListener("keydown",a),()=>window.removeEventListener("keydown",a)},[G,Y]);const ve=()=>{if(!C){p("err_forbidden_add");return}A("category"),N(null),k(null),x(ae()),i(""),T(!0)},_e=a=>{if(!w){p("err_forbidden");return}A("category"),N(a),k(null),x({name:a.name||"",category_id:"",status:a.status||"active"}),i(""),T(!0)},ie=(a="")=>{if(!C){p("err_forbidden_add");return}A("subcategory"),N(null),k(null),x({name:"",category_id:a,status:"active"}),i(""),T(!0)},ye=a=>{if(!w){p("err_forbidden");return}A("subcategory"),k(a),N(null),x({name:a.name||"",category_id:a.category_id||"",status:a.status||"active"}),i(""),T(!0)},je=a=>{if(!z){p("err_forbidden");return}A("category"),N(a),k(null),i(""),U(!0)},we=a=>{if(!z){p("err_forbidden");return}A("subcategory"),k(a),N(null),i(""),U(!0)},Ne=async a=>{if(a.preventDefault(),E||b){if(!w){i("err_forbidden");return}}else if(!C){i("err_forbidden_add");return}q(!0),i("");try{const s=f.name.trim();if(!s){i("err_save");return}if(m==="subcategory"){const n={name:s,category_id:parseInt(f.category_id,10),status:f.status};E?await g.updateSub(E.id,n):await g.createSub(n)}else{const n={name:s,status:f.status};b?await g.update(b.id,n):await g.create(n)}_(),F()}catch(s){console.error(s),i("err_save")}finally{q(!1)}},ke=async()=>{if(!z){i("err_forbidden");return}q(!0),i("");try{m==="subcategory"&&E?await g.deleteSub(E.id):b&&(await g.delete(b.id),String(b.id)===c&&$("all")),_(),F()}catch(a){console.error(a),i("err_delete")}finally{q(!1)}},Se=async(a,s="category")=>{if(!w){p("err_forbidden");return}const n=a.status==="active"?"inactive":"active";try{s==="subcategory"?await g.updateSubStatus(a.id,n):await g.updateStatus(a.id,n),F()}catch(l){console.error(l),p("err_save")}},Ce=a=>he(s=>({...s,[a]:!s[a]})),ze=a=>{$(String(a.id)),H(""),J("all"),V("subs")},y=W.trim().toLowerCase(),Q=o.useMemo(()=>u.filter(a=>{const s=!y||(a.name||"").toLowerCase().includes(y)||a.sous_categories?.some(ee=>(ee.name||"").toLowerCase().includes(y)),n=v==="all"||a.status===v,l=c==="all"||String(a.id)===c;return s&&n&&l}).sort((a,s)=>(a.name||"").localeCompare(s.name||"")),[u,y,v,c]),B=o.useMemo(()=>u.flatMap(a=>(a.sous_categories||[]).map(s=>({...s,parent:a}))),[u]),X=o.useMemo(()=>B.filter(a=>{const s=!y||(a.name||"").toLowerCase().includes(y)||(a.parent?.name||"").toLowerCase().includes(y),n=v==="all"||a.status===v,l=c==="all"||String(a.parent?.id)===c;return s&&n&&l}).sort((a,s)=>(a.parent?.name||"").localeCompare(s.parent?.name||"")||(a.name||"").localeCompare(s.name||"")),[B,y,v,c]),L=o.useMemo(()=>{const a=u.length,s=u.filter(n=>n.status==="active").length;return{total:a,active:s,subs:B.length}},[u,B]),le=o.useMemo(()=>[...u].sort((a,s)=>(a.name||"").localeCompare(s.name||"")),[u]),Ae=!!(W||v!=="all"||c!=="all"),Ee=()=>{H(""),J("all"),$("all")},M=4,Z=(a,s)=>e.jsxs("div",{className:"ep-actions",children:[s==="category"&&C&&e.jsx("button",{type:"button",className:"btn-icon btn-add-sub",onClick:()=>ie(a.id),title:t.add_sub_title,"aria-label":t.add_sub_title,children:e.jsx("i",{className:"fas fa-plus"})}),w&&e.jsx("button",{type:"button",className:`btn-icon ${a.status==="inactive"?"btn-toggle-on":"btn-toggle-off"}`,onClick:()=>Se(a,s),title:a.status==="inactive"?t.toggle_on:t.toggle_off,"aria-label":a.status==="inactive"?t.toggle_on:t.toggle_off,children:e.jsx("i",{className:`fas fa-${a.status==="inactive"?"play":"pause"}`})}),w&&e.jsx("button",{type:"button",className:"btn-icon btn-edit",onClick:()=>s==="category"?_e(a):ye(a),title:t.edit,"aria-label":t.edit,children:e.jsx("i",{className:"fas fa-edit"})}),z&&e.jsx("button",{type:"button",className:"btn-icon btn-delete",onClick:()=>s==="category"?je(a):we(a),title:t.delete,"aria-label":t.delete,children:e.jsx("i",{className:"fas fa-trash-alt"})}),!w&&!z&&e.jsx("span",{style:{color:"#98a6ba",fontSize:"var(--fs-xs)"},children:"—"})]}),P=a=>e.jsxs("span",{className:`ep-badge ${a==="inactive"?"badge-rose":"badge-green"}`,children:[e.jsx("i",{className:"fas fa-circle",style:{fontSize:6}}),a==="inactive"?t.inactive:t.active]});return be?e.jsxs("div",{className:"expenses-page",dir:t.dir,lang:d,style:{textAlign:"center",paddingTop:60},children:[e.jsx("span",{className:"ep-spinner"})," ",t.loading]}):e.jsxs("div",{className:"expenses-page",dir:t.dir,lang:d,children:[e.jsx("link",{rel:"stylesheet",href:"https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"}),e.jsx("style",{children:`
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap');

.expenses-page {
  --ink: #14213d;
  --muted: #718096;
  --line: #e5eaf2;
  --bg: #f4f7fc;
  --card: #ffffff;
  --primary: #2563eb;  --primary-soft: #eaf1ff;
  --green: #0f9d74;    --green-soft: #e1f6ee;
  --violet: #7054d8;   --violet-soft: #eeeaff;
  --amber: #d99013;    --amber-soft: #fff4df;
  --red: #dc4654;      --red-soft: #ffeaec;
  --teal: #0e8fa8;
  --rose: #c2417c;

  /* Échelle typographique responsive */
  --fs-xs:  clamp(11px, 0.70vw + 9px,  13px);
  --fs-sm:  clamp(12px, 0.75vw + 10px, 14px);
  --fs-md:  clamp(13px, 0.80vw + 11px, 15px);
  --fs-lg:  clamp(15px, 0.90vw + 12px, 18px);
  --fs-2xl: clamp(20px, 1.80vw + 14px, 28px);

  min-height: 100vh;
  padding: clamp(10px, 2vw, 26px);
  background: radial-gradient(900px 300px at 100% -80px, rgba(37,99,235,.07), transparent 70%), var(--bg);
  color: var(--ink);
  font-family: Inter, "Segoe UI", system-ui, Arial, sans-serif;
  font-size: var(--fs-md);
  -webkit-text-size-adjust: 100%;
}
.expenses-page[lang="ar"] { font-family: Cairo, Tahoma, Arial, sans-serif; line-height: 1.6; }
.expenses-page * { box-sizing: border-box; }
.expenses-page button, .expenses-page input, .expenses-page select { font-family: inherit; }
.expenses-page button:focus-visible, .expenses-page input:focus-visible, .expenses-page select:focus-visible {
  outline: 3px solid rgba(37,99,235,.25); outline-offset: 2px;
}

/* HEADER */
.ep-hero {
  position: relative; isolation: isolate; overflow: hidden;
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;
  padding: clamp(16px, 2.5vw, 28px); margin-bottom: 20px; border-radius: 18px; color: #fff;
  background: linear-gradient(125deg, #102f65, #2058c5 60%, #2698cf);
  box-shadow: 0 10px 28px rgba(21,74,170,.16);
}
.ep-hero::after { content: ""; position: absolute; z-index: -1; width: 230px; height: 230px; inset-inline-end: -75px; top: -120px; border: 28px solid rgba(255,255,255,.08); border-radius: 50%; }
.ep-eyebrow { font-size: var(--fs-xs); font-weight: 800; letter-spacing: 1.5px; opacity: .78; }
.ep-title h1 { display: flex; align-items: center; gap: 11px; margin: 7px 0 5px; font-size: var(--fs-2xl); font-weight: 800; line-height: 1.3; }
.ep-title-icon { display: inline-grid; place-items: center; flex: 0 0 auto; width: clamp(34px, 4vw, 42px); height: clamp(34px, 4vw, 42px); border-radius: 12px; background: rgba(255,255,255,.16); font-size: var(--fs-lg); }
.ep-title p { margin: 0; color: rgba(255,255,255,.82); font-size: var(--fs-sm); }
.ep-hero-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 9px; }
.ep-lang { display: inline-flex; padding: 3px; border-radius: 10px; background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.24); }
.ep-lang button { border: 0; padding: 7px 12px; border-radius: 7px; background: transparent; color: #fff; font-size: var(--fs-xs); font-weight: 800; cursor: pointer; }
.ep-lang button.on { background: #fff; color: #174078; }
.ep-btn-add { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 16px; border: 0; border-radius: 10px; background: #fff; color: #174078; font-size: var(--fs-sm); font-weight: 700; cursor: pointer; box-shadow: 0 5px 14px rgba(0,0,0,.12); transition: .2s; }
.ep-btn-add:hover { transform: translateY(-2px); }
.ep-btn-add.alt { background: rgba(255,255,255,.14); color: #fff; border: 1px solid rgba(255,255,255,.4); box-shadow: none; }

/* ALERT */
.ep-alert { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; padding: 12px 15px; border: 1px solid #f5c6cb; border-radius: 10px; background: var(--red-soft); color: #a3212e; font-size: var(--fs-sm); }
.ep-alert button { border: 0; padding: 7px 12px; border-radius: 7px; background: #fff; color: #a3212e; font-size: var(--fs-xs); font-weight: 700; cursor: pointer; }

/* STATS */
.ep-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; margin-bottom: 20px; }
.ep-card { position: relative; overflow: hidden; display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; min-width: 0; padding: clamp(13px, 1.6vw, 17px); background: var(--card); border: 1px solid var(--line); border-inline-start: 4px solid var(--accent); border-radius: 14px; box-shadow: 0 3px 12px rgba(20,33,61,.035); transition: transform .2s, box-shadow .2s; }
.ep-card:hover { transform: translateY(-2px); box-shadow: 0 9px 20px rgba(20,33,61,.07); }
.ep-card::after { content: ""; position: absolute; inset-inline-end: -28px; bottom: -40px; width: 100px; height: 100px; border-radius: 50%; background: var(--accent-soft); opacity: .65; }
.ep-card-info { position: relative; z-index: 1; min-width: 0; }
.ep-card-info h3 { margin: 0 0 7px; color: var(--muted); font-size: var(--fs-sm); font-weight: 700; }
.ep-card-info .value { color: var(--ink); font-size: var(--fs-2xl); font-weight: 800; line-height: 1.2; }
.ep-card-info .sub { margin-top: 5px; color: var(--accent); font-size: var(--fs-xs); font-weight: 600; }
.ep-icon { position: relative; z-index: 1; flex: 0 0 auto; width: clamp(36px, 3.5vw, 42px); height: clamp(36px, 3.5vw, 42px); display: grid; place-items: center; border-radius: 12px; background: var(--accent-soft); color: var(--accent); font-size: var(--fs-lg); }
.tone-amber  { --accent: var(--amber);   --accent-soft: var(--amber-soft); }
.tone-violet { --accent: var(--violet);  --accent-soft: var(--violet-soft); }
.tone-blue   { --accent: var(--primary); --accent-soft: var(--primary-soft); }
.tone-green  { --accent: var(--green);   --accent-soft: var(--green-soft); }

/* PANEL */
.ep-panel { overflow: hidden; background: var(--card); border: 1px solid var(--line); border-radius: 15px; box-shadow: 0 3px 12px rgba(20,33,61,.035); }

/* TABS */
.ep-tabs { display: flex; gap: 6px; padding: 12px 17px 0; background: #fbfcff; border-bottom: 1px solid var(--line); overflow-x: auto; }
.ep-tab { display: inline-flex; align-items: center; gap: 8px; padding: 10px 14px; border: 0; border-bottom: 3px solid transparent; background: transparent; color: var(--muted); font-size: var(--fs-sm); font-weight: 700; cursor: pointer; white-space: nowrap; margin-bottom: -1px; }
.ep-tab:hover { color: var(--primary); }
.ep-tab.on { color: var(--primary); border-bottom-color: var(--primary); }
.ep-tab .count { padding: 2px 8px; border-radius: 999px; background: #eef2f8; color: #4b5b75; font-size: var(--fs-xs); font-weight: 800; }
.ep-tab.on .count { background: var(--primary-soft); color: var(--primary); }

/* FILTERS */
.ep-filters { display: grid; grid-template-columns: minmax(180px, 1.3fr) minmax(170px, 1fr) minmax(160px, 1fr) auto; align-items: center; gap: 10px; padding: 14px 17px; background: #fbfcff; border-bottom: 1px solid var(--line); }
.ep-filter-input { width: 100%; min-width: 0; height: 42px; padding: 0 12px; border: 1px solid #dce3ed; border-radius: 9px; background: #fff; color: #2a3a55; font-size: max(16px, var(--fs-md)); outline: none; transition: .2s; }
.ep-filter-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-soft); }
.ep-reset { height: 42px; padding: 0 13px; border: 1px solid var(--line); border-radius: 9px; background: #fff; color: #4b5b75; font-size: var(--fs-sm); font-weight: 700; cursor: pointer; white-space: nowrap; }
.ep-reset:hover { background: #f1f5fb; }
.ep-resultbar { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; padding: 10px 17px; border-bottom: 1px solid var(--line); background: #fff; font-size: var(--fs-sm); color: var(--muted); }
.ep-resultbar strong { color: var(--ink); }
.ep-chip { display: inline-flex; align-items: center; gap: 6px; padding: 4px 6px 4px 10px; border-radius: 999px; background: var(--primary-soft); color: var(--primary); font-size: var(--fs-xs); font-weight: 800; }
.ep-chip button { border: 0; width: 20px; height: 20px; border-radius: 50%; background: rgba(37,99,235,.15); color: var(--primary); font-size: 10px; cursor: pointer; display: grid; place-items: center; }

/* TABLE */
.ep-table-wrap { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
.ep-table { width: 100%; min-width: 620px; border-collapse: collapse; }
.ep-table th { padding: 13px 17px; background: #f5f7fb; color: #5b6b85; text-align: start; font-size: var(--fs-xs); font-weight: 800; letter-spacing: .2px; border-bottom: 1px solid var(--line); white-space: nowrap; }
.ep-table td { padding: 12px 17px; border-bottom: 1px solid #eff2f7; color: #44546d; font-size: var(--fs-sm); vertical-align: middle; }
.ep-table tbody tr:nth-child(even) td { background: #fbfcfe; }
.ep-table tbody tr:hover td { background: #f1f5ff; }
.ep-table tr:last-child td { border-bottom: 0; }
.ep-col-end { text-align: end !important; }
.ep-state { padding: 38px 18px !important; text-align: center; color: #8896ab !important; font-size: var(--fs-sm) !important; }
.ep-spinner { display: inline-block; width: 20px; height: 20px; margin-inline-end: 9px; vertical-align: middle; border: 3px solid #dbeafe; border-top-color: var(--primary); border-radius: 50%; animation: ep-spin .75s linear infinite; }
@keyframes ep-spin { to { transform: rotate(360deg); } }

.ep-badge { display: inline-flex; align-items: center; gap: 5px; padding: 4px 9px; border-radius: 999px; font-size: var(--fs-xs); font-weight: 700; white-space: nowrap; }
button.ep-badge { border: 0; cursor: pointer; }
button.ep-badge:hover { filter: brightness(.95); }
.badge-blue   { background: var(--primary-soft); color: #164aba; }
.badge-violet { background: var(--violet-soft);  color: #4a32b0; }
.badge-green  { background: var(--green-soft);   color: #0b6a4e; }
.badge-amber  { background: var(--amber-soft);   color: #94590a; }
.badge-rose   { background: #fbe6f0; color: #9c2a62; }
.badge-teal   { background: #dcf3f8; color: #0a6577; }

/* ROWS */
.ep-row-inactive td { color: #8896ab !important; }
.ep-cat-cell { display: flex; align-items: center; gap: 9px; min-width: 180px; }
.ep-cat-avatar { flex: 0 0 34px; width: 34px; height: 34px; display: grid; place-items: center; border-radius: 9px; background: var(--primary-soft); color: var(--primary); font-size: var(--fs-sm); }
.ep-cat-avatar.sub { background: var(--amber-soft); color: var(--amber); }
.ep-cat-toggle { flex: 0 0 26px; width: 26px; height: 26px; display: grid; place-items: center; border: 0; border-radius: 7px; background: #eef2f8; color: #4b5b75; font-size: 10px; cursor: pointer; }
.ep-cat-toggle:hover { background: var(--primary-soft); color: var(--primary); }
.ep-cat-name { color: #2a3a55; font-size: var(--fs-md); font-weight: 700; }
.ep-cat-meta { margin-top: 3px; color: var(--muted); font-size: var(--fs-xs); }
.ep-subrow td { padding: 0 !important; background: #f7f9fd !important; }
.ep-subtable { width: 100%; border-collapse: collapse; }
.ep-subtable td { padding: 10px 17px !important; border-bottom: 1px solid #edf1f7; background: #f7f9fd !important; font-size: var(--fs-xs); }
.ep-subtable tr:last-child td { border-bottom: 0; }
.ep-subname { display: flex; align-items: center; gap: 9px; color: #44546d; font-size: var(--fs-sm); }
.ep-subname i { color: #98a6ba; font-size: 11px; }
.ep-subname.inactive span { color: #98a6ba; text-decoration: line-through; }

/* ACTIONS */
.ep-actions { display: flex; justify-content: flex-end; align-items: center; gap: 6px; white-space: nowrap; }
.btn-icon { flex: 0 0 34px; width: 34px; height: 34px; display: grid; place-items: center; border: 1px solid transparent; border-radius: 8px; background: transparent; color: #64748b; font-size: var(--fs-xs); cursor: pointer; transition: .18s; }
.btn-icon:hover { background: #eef2f8; }
.btn-edit { background: var(--primary-soft); color: var(--primary); border-color: #c9daff; }
.btn-edit:hover { background: var(--primary); color: #fff; }
.btn-delete { background: var(--red-soft); color: var(--red); border-color: #f6c8cd; }
.btn-delete:hover { background: var(--red); color: #fff; }
.btn-add-sub, .btn-toggle-on { background: var(--green-soft); color: var(--green); border-color: #bfe8d9; }
.btn-add-sub:hover, .btn-toggle-on:hover { background: var(--green); color: #fff; }
.btn-toggle-off { background: var(--amber-soft); color: var(--amber); border-color: #f5dcb0; }
.btn-toggle-off:hover { background: var(--amber); color: #fff; }

/* MODALS */
.ep-modal-overlay { position: fixed; inset: 0; z-index: 1050; display: flex; align-items: center; justify-content: center; padding: 16px; background: rgba(15,23,42,.58); backdrop-filter: blur(5px); overflow-y: auto; }
.ep-modal { width: 100%; max-width: 460px; max-height: calc(100vh - 32px); overflow-y: auto; background: #fff; border-radius: 17px; box-shadow: 0 25px 60px rgba(0,0,0,.22); animation: ep-modal-in .18s ease-out; }
@keyframes ep-modal-in { from { opacity: 0; transform: translateY(8px) scale(.99); } to { opacity: 1; transform: none; } }
.ep-modal-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px 20px; border-bottom: 1px solid var(--line); background: linear-gradient(180deg, #f8faff, #fff); }
.ep-modal-header h3 { margin: 0; color: var(--ink); font-size: var(--fs-lg); font-weight: 800; }
.ep-modal-body { padding: 20px; }
.ep-modal-footer { display: flex; justify-content: flex-end; gap: 9px; padding: 14px 20px; background: #f8fafd; border-top: 1px solid var(--line); }
.ep-modal-footer.center { justify-content: center; }
.ep-form-group { margin-bottom: 16px; }
.ep-form-group:last-child { margin-bottom: 0; }
.ep-form-group label { display: block; margin-bottom: 7px; color: #43536b; font-size: var(--fs-xs); font-weight: 700; }
.ep-form-group input, .ep-form-group select { width: 100%; min-height: 43px; padding: 10px 12px; border: 1px solid #d9e1ed; border-radius: 9px; background: #fbfcfe; color: #2a3a55; font-size: max(16px, var(--fs-md)); outline: none; transition: .2s; }
.ep-form-group input:focus, .ep-form-group select:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-soft); background: #fff; }
.ep-form-error { margin-bottom: 14px; padding: 11px 13px; border-radius: 9px; background: var(--red-soft); color: #a3212e; font-size: var(--fs-xs); font-weight: 600; }
.ep-btn { min-height: 40px; padding: 9px 17px; border: 0; border-radius: 9px; font-size: var(--fs-sm); font-weight: 700; cursor: pointer; transition: .18s; }
.ep-btn:hover:not(:disabled) { filter: brightness(.96); transform: translateY(-1px); }
.ep-btn:disabled { opacity: .6; cursor: not-allowed; }
.ep-btn-cancel { background: #e8edf5; color: #44546d; }
.ep-btn-save { background: linear-gradient(135deg, #1f5eea, #347cf0); color: #fff; box-shadow: 0 4px 10px rgba(31,94,234,.18); }
.ep-btn-danger { background: var(--red); color: #fff; }
.ep-delete-body { padding: 27px 22px 12px; text-align: center; }
.ep-delete-icon { display: inline-grid; place-items: center; width: 55px; height: 55px; margin-bottom: 13px; border-radius: 50%; background: var(--red-soft); color: var(--red); font-size: 22px; }
.ep-delete-body h4 { margin: 0 0 8px; color: var(--ink); font-size: var(--fs-lg); font-weight: 800; }
.ep-delete-body p { margin: 0 0 13px; color: var(--muted); font-size: var(--fs-sm); line-height: 1.7; }

/* TABLET */
@media (max-width: 1000px) {
  .ep-filters { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .ep-filters > :first-child { grid-column: 1 / -1; }
  .ep-filters > :last-child { justify-self: start; }
}
@media (max-width: 900px) {
  .ep-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .ep-stats .ep-card:last-child { grid-column: 1 / -1; }
}

/* MOBILE */
@media (max-width: 600px) {
  .expenses-page { padding: 10px; }
  .ep-hero { border-radius: 14px; }
  .ep-hero-actions { width: 100%; }
  .ep-btn-add { flex: 1; }
  .ep-stats { grid-template-columns: 1fr; gap: 10px; }
  .ep-stats .ep-card:last-child { grid-column: auto; }
  .ep-tabs { padding: 10px 10px 0; }
  .ep-tab { flex: 1; justify-content: center; }
  .ep-filters { grid-template-columns: 1fr; padding: 12px; }
  .ep-filters > :last-child { justify-self: stretch; }
  .ep-reset { width: 100%; }
  .ep-resultbar { padding: 10px 12px; }
  .ep-table th, .ep-table td { padding: 11px 12px; }
  .ep-modal-overlay { align-items: flex-end; padding: 10px; }
  .ep-modal { max-height: 90vh; border-radius: 16px; }
  .ep-modal-header, .ep-modal-body { padding: 16px; }
  .ep-modal-footer { padding: 12px 16px; }
  .ep-modal-footer .ep-btn { flex: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .ep-spinner { animation-duration: 2s; }
  .ep-card, .ep-btn-add, .ep-btn, .ep-modal { transition: none; animation: none; }
}
      `}),e.jsxs("header",{className:"ep-hero",children:[e.jsxs("div",{className:"ep-title",children:[e.jsx("span",{className:"ep-eyebrow",children:"GESTISTOCK"}),e.jsxs("h1",{children:[e.jsx("span",{className:"ep-title-icon",children:e.jsx("i",{className:"fas fa-tags"})}),t.title]}),e.jsxs("p",{children:[t.subtitle," — ",e.jsx("strong",{children:ge})]})]}),e.jsxs("div",{className:"ep-hero-actions",children:[e.jsxs("div",{className:"ep-lang",role:"group","aria-label":t.switch_title,title:t.switch_title,children:[e.jsx("button",{type:"button",className:d==="fr"?"on":"",onClick:()=>S("fr"),"aria-pressed":d==="fr",children:"FR"}),e.jsx("button",{type:"button",className:d==="ar"?"on":"",onClick:()=>S("ar"),"aria-pressed":d==="ar",children:"عربية"})]}),C&&e.jsxs("button",{className:"ep-btn-add alt",type:"button",onClick:()=>ie(c!=="all"?c:""),children:[e.jsx("i",{className:"fas fa-sitemap"})," ",t.add_sub]}),C&&e.jsxs("button",{className:"ep-btn-add",type:"button",onClick:ve,children:[e.jsx("i",{className:"fas fa-plus"})," ",t.add]})]})]}),ne&&e.jsxs("div",{className:"ep-alert",role:"alert",children:[e.jsxs("span",{children:[e.jsx("i",{className:"fas fa-exclamation-circle"}),"  ",t[ne]]}),e.jsx("button",{type:"button",onClick:()=>{p(""),F()},children:t.retry})]}),e.jsxs("section",{className:"ep-stats",children:[e.jsxs("div",{className:"ep-card tone-blue",children:[e.jsxs("div",{className:"ep-card-info",children:[e.jsx("h3",{children:t.stat_total}),e.jsx("div",{className:"value",children:L.total}),e.jsx("div",{className:"sub",children:t.records(L.total)})]}),e.jsx("div",{className:"ep-icon",children:e.jsx("i",{className:"fas fa-layer-group"})})]}),e.jsxs("div",{className:"ep-card tone-green",children:[e.jsxs("div",{className:"ep-card-info",children:[e.jsx("h3",{children:t.stat_active}),e.jsx("div",{className:"value",children:L.active}),e.jsx("div",{className:"sub",children:t.active_sub})]}),e.jsx("div",{className:"ep-icon",children:e.jsx("i",{className:"fas fa-check-circle"})})]}),e.jsxs("div",{className:"ep-card tone-amber",children:[e.jsxs("div",{className:"ep-card-info",children:[e.jsx("h3",{children:t.stat_subs}),e.jsx("div",{className:"value",children:L.subs}),e.jsx("div",{className:"sub",children:t.subs_sub})]}),e.jsx("div",{className:"ep-icon",children:e.jsx("i",{className:"fas fa-sitemap"})})]})]}),e.jsxs("div",{className:"ep-panel",children:[e.jsxs("div",{className:"ep-tabs",role:"tablist",children:[e.jsxs("button",{type:"button",role:"tab","aria-selected":h==="categories",className:`ep-tab ${h==="categories"?"on":""}`,onClick:()=>V("categories"),children:[e.jsx("i",{className:"fas fa-tags"})," ",t.tab_cats," ",e.jsx("span",{className:"count",children:L.total})]}),e.jsxs("button",{type:"button",role:"tab","aria-selected":h==="subs",className:`ep-tab ${h==="subs"?"on":""}`,onClick:()=>V("subs"),children:[e.jsx("i",{className:"fas fa-sitemap"})," ",t.tab_subs," ",e.jsx("span",{className:"count",children:L.subs})]})]}),e.jsxs("div",{className:"ep-filters",children:[e.jsx("input",{type:"search",placeholder:t.search_ph,"aria-label":t.search_ph,className:"ep-filter-input",value:W,onChange:a=>H(a.target.value)}),e.jsxs("select",{className:"ep-filter-input","aria-label":t.filter_category,value:c,onChange:a=>$(a.target.value),children:[e.jsx("option",{value:"all",children:t.all_categories}),le.map(a=>e.jsx("option",{value:String(a.id),children:a.name},a.id))]}),e.jsxs("select",{className:"ep-filter-input","aria-label":t.th_status,value:v,onChange:a=>J(a.target.value),children:[e.jsx("option",{value:"all",children:t.all_status}),e.jsx("option",{value:"active",children:t.status_active}),e.jsx("option",{value:"inactive",children:t.status_inactive})]}),Ae?e.jsxs("button",{type:"button",className:"ep-reset",onClick:Ee,children:[e.jsx("i",{className:"fas fa-rotate-left"})," ",t.reset]}):e.jsx("span",{})]}),e.jsxs("div",{className:"ep-resultbar",children:[e.jsxs("span",{children:[e.jsx("strong",{children:h==="subs"?X.length:Q.length})," ",h==="subs"?t.tab_subs.toLowerCase():t.tab_cats.toLowerCase()]}),c!=="all"&&e.jsxs("span",{className:"ep-chip",children:[e.jsx("i",{className:"fas fa-tag"}),u.find(a=>String(a.id)===c)?.name,e.jsx("button",{type:"button",onClick:()=>$("all"),"aria-label":t.reset,children:e.jsx("i",{className:"fas fa-times"})})]})]}),h==="subs"&&e.jsx("div",{className:"ep-table-wrap",children:e.jsxs("table",{className:"ep-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:t.th_sub_name}),e.jsx("th",{children:t.th_parent}),e.jsx("th",{children:t.th_status}),e.jsx("th",{className:"ep-col-end",children:t.th_actions})]})}),e.jsx("tbody",{children:re?e.jsx("tr",{children:e.jsxs("td",{colSpan:M,className:"ep-state",children:[e.jsx("span",{className:"ep-spinner"}),t.loading]})}):X.length===0?e.jsx("tr",{children:e.jsx("td",{colSpan:M,className:"ep-state",children:t.none_subs})}):X.map(a=>e.jsxs("tr",{className:a.status==="inactive"?"ep-row-inactive":"",children:[e.jsx("td",{children:e.jsxs("div",{className:"ep-cat-cell",children:[e.jsx("div",{className:"ep-cat-avatar sub",children:e.jsx("i",{className:"fas fa-sitemap"})}),e.jsx("div",{className:"ep-cat-name",children:a.name})]})}),e.jsx("td",{children:e.jsxs("span",{className:`ep-badge badge-${ue(a.parent?.name||"")}`,children:[e.jsx("i",{className:"fas fa-tag"}),a.parent?.name]})}),e.jsx("td",{children:P(a.status)}),e.jsx("td",{className:"ep-col-end",children:Z(a,"subcategory")})]},a.id))})]})}),h==="categories"&&e.jsx("div",{className:"ep-table-wrap",children:e.jsxs("table",{className:"ep-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:t.th_name}),e.jsx("th",{children:t.th_subs}),e.jsx("th",{children:t.th_status}),e.jsx("th",{className:"ep-col-end",children:t.th_actions})]})}),e.jsx("tbody",{children:re?e.jsx("tr",{children:e.jsxs("td",{colSpan:M,className:"ep-state",children:[e.jsx("span",{className:"ep-spinner"}),t.loading]})}):Q.length===0?e.jsx("tr",{children:e.jsx("td",{colSpan:M,className:"ep-state",children:t.none})}):Q.map(a=>{const s=a.sous_categories||[],n=s.length>0,l=!!xe[a.id],ee=a.status==="inactive";return e.jsxs(Te.Fragment,{children:[e.jsxs("tr",{className:ee?"ep-row-inactive":"",children:[e.jsx("td",{children:e.jsxs("div",{className:"ep-cat-cell",children:[n?e.jsx("button",{type:"button",className:"ep-cat-toggle",onClick:()=>Ce(a.id),"aria-expanded":l,"aria-label":l?t.collapse:t.expand,children:e.jsx("i",{className:`fas fa-chevron-${l?"down":"right"}`})}):e.jsx("span",{style:{width:26,display:"inline-block"}}),e.jsx("div",{className:"ep-cat-avatar",children:e.jsx("i",{className:"fas fa-tag"})}),e.jsxs("div",{children:[e.jsx("div",{className:"ep-cat-name",children:a.name}),n&&e.jsx("div",{className:"ep-cat-meta",children:t.sub_count(s.length)})]})]})}),e.jsx("td",{children:n?e.jsxs("button",{type:"button",className:`ep-badge badge-${ue(a.name||"")}`,onClick:()=>ze(a),title:t.view_subs,"aria-label":t.view_subs,children:[e.jsx("i",{className:"fas fa-sitemap"}),s.length,e.jsx("i",{className:"fas fa-arrow-up-right-from-square",style:{fontSize:9,opacity:.7}})]}):e.jsx("span",{style:{color:"#98a6ba",fontSize:"var(--fs-xs)"},children:t.no_subs})}),e.jsx("td",{children:P(a.status)}),e.jsx("td",{className:"ep-col-end",children:Z(a,"category")})]}),n&&l&&e.jsx("tr",{className:"ep-subrow",children:e.jsx("td",{colSpan:M,children:e.jsx("table",{className:"ep-subtable",children:e.jsx("tbody",{children:s.map(D=>{const Le=D.status==="inactive";return e.jsxs("tr",{children:[e.jsx("td",{style:{width:"55%"},children:e.jsxs("div",{className:`ep-subname ${Le?"inactive":""}`,children:[e.jsx("i",{className:"fas fa-level-up-alt",style:{transform:"rotate(90deg)"}}),e.jsx("span",{children:D.name})]})}),e.jsx("td",{style:{width:"20%"},children:P(D.status)}),e.jsx("td",{className:"ep-col-end",children:Z(D,"subcategory")})]},D.id)})})})})})]},a.id)})})]})})]}),G&&e.jsx("div",{className:"ep-modal-overlay",onMouseDown:a=>a.target===a.currentTarget&&_(),children:e.jsxs("div",{className:"ep-modal",role:"dialog","aria-modal":"true","aria-labelledby":"ep-form-title",children:[e.jsxs("div",{className:"ep-modal-header",children:[e.jsx("h3",{id:"ep-form-title",children:m==="subcategory"?E?t.modal_edit_sub:t.modal_new_sub:b?t.modal_edit_cat:t.modal_new_cat}),e.jsx("button",{type:"button",className:"btn-icon",onClick:_,"aria-label":t.close,children:e.jsx("i",{className:"fas fa-times"})})]}),e.jsxs("form",{onSubmit:Ne,children:[e.jsxs("div",{className:"ep-modal-body",children:[R&&e.jsx("div",{className:"ep-form-error",role:"alert",children:t[R]}),e.jsxs("div",{className:"ep-form-group",children:[e.jsx("label",{htmlFor:"ep-name",children:m==="subcategory"?t.f_name_sub:t.f_name_cat}),e.jsx("input",{id:"ep-name",type:"text",required:!0,placeholder:m==="subcategory"?t.f_name_sub_ph:t.f_name_cat_ph,value:f.name,onChange:a=>x({...f,name:a.target.value})})]}),m==="subcategory"&&e.jsxs("div",{className:"ep-form-group",children:[e.jsx("label",{htmlFor:"ep-parent",children:t.f_parent}),e.jsxs("select",{id:"ep-parent",required:!0,value:f.category_id,onChange:a=>x({...f,category_id:a.target.value}),children:[e.jsx("option",{value:"",children:t.f_parent_ph}),le.map(a=>e.jsx("option",{value:a.id,children:a.name},a.id))]})]}),e.jsxs("div",{className:"ep-form-group",children:[e.jsx("label",{htmlFor:"ep-status",children:t.f_status}),e.jsxs("select",{id:"ep-status",value:f.status,onChange:a=>x({...f,status:a.target.value}),children:[e.jsx("option",{value:"active",children:t.active}),e.jsx("option",{value:"inactive",children:t.inactive})]})]})]}),e.jsxs("div",{className:"ep-modal-footer",children:[e.jsx("button",{type:"button",className:"ep-btn ep-btn-cancel",onClick:_,children:t.cancel}),e.jsx("button",{type:"submit",className:"ep-btn ep-btn-save",disabled:O,children:O?t.saving:t.save})]})]})]})}),Y&&e.jsx("div",{className:"ep-modal-overlay",onMouseDown:a=>a.target===a.currentTarget&&_(),children:e.jsxs("div",{className:"ep-modal",style:{maxWidth:400},role:"alertdialog","aria-modal":"true","aria-labelledby":"ep-delete-title",children:[e.jsxs("div",{className:"ep-delete-body",children:[e.jsx("span",{className:"ep-delete-icon",children:e.jsx("i",{className:"fas fa-exclamation-triangle"})}),e.jsx("h4",{id:"ep-delete-title",children:m==="subcategory"?t.delete_sub_title:t.delete_cat_title}),e.jsx("p",{children:t.delete_warn}),m==="category"&&b?.sous_categories?.length>0&&e.jsxs("div",{className:"ep-form-error",style:{background:"var(--amber-soft)",color:"#94590a"},children:[e.jsx("i",{className:"fas fa-exclamation-circle",style:{marginInlineEnd:6}}),t.delete_sub_warn(b.sous_categories.length)]}),R&&e.jsx("div",{className:"ep-form-error",role:"alert",children:t[R]})]}),e.jsxs("div",{className:"ep-modal-footer center",children:[e.jsx("button",{type:"button",className:"ep-btn ep-btn-cancel",onClick:_,children:t.cancel}),e.jsx("button",{type:"button",className:"ep-btn ep-btn-danger",onClick:ke,disabled:O||!z,children:O?t.deleting:t.delete_confirm})]})]})})]})};export{Ie as default};
