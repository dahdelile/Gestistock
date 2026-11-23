import{a as Z,r as s,j as e,s as G}from"./index-BPK71jDm.js";import{u as k}from"./index-BYzbn2Io.js";const q={fr:{dir:"ltr",title:"Gestion des utilisateurs",subtitle:"Gérez les accès, les rôles et les informations de votre équipe.",add:"Nouvel utilisateur",search_ph:"Rechercher un nom, email...",all_roles:"Tous les rôles",role_admin:"Administrateur",role_manager:"Gérant",role_cashier:"Caissier",role_stock:"Gestionnaire de stock",th_name:"Utilisateur",th_role:"Rôle",th_status:"Statut",th_date:"Date de création",th_actions:"Actions",loading:"Chargement des utilisateurs...",none:"Aucun utilisateur trouvé.",active:"Actif",inactive:"Inactif",edit:"Modifier",delete:"Supprimer",cancel:"Annuler",save:"Enregistrer",saving:"Enregistrement...",close:"Fermer",you:"Vous",readonly:"Mode lecture seule : seuls les administrateurs peuvent ajouter, modifier ou supprimer des utilisateurs.",modal_new:"Nouvel utilisateur",modal_edit:"Modifier l'utilisateur",f_name:"Nom complet",f_email:"Adresse email",f_password:"Mot de passe",f_password_hint:"Laissez vide pour conserver le mot de passe actuel (en modification).",f_role:"Rôle",f_status:"Statut",delete_title:"Supprimer cet utilisateur ?",delete_warn:"Cette action est irréversible. L'utilisateur perdra immédiatement accès au système.",delete_confirm:"Oui, supprimer",ok_saved:"Utilisateur enregistré avec succès.",ok_updated:"Rôle mis à jour. L’utilisateur doit se déconnecter / reconnecter pour voir le changement.",ok_deleted:"Utilisateur supprimé.",err_save:"Erreur lors de l'enregistrement.",err_delete:"Erreur lors de la suppression.",err_load:"Impossible de charger les utilisateurs.",err_forbidden:"Action réservée aux administrateurs."},ar:{dir:"rtl",title:"إدارة المستخدمين",subtitle:"أدر صلاحيات وأدوار ومعلومات فريقك.",add:"مستخدم جديد",search_ph:"ابحث بالاسم أو البريد الإلكتروني...",all_roles:"كل الأدوار",role_admin:"مدير النظام",role_manager:"مدير",role_cashier:"أمين صندوق",role_stock:"أمين مخزن",th_name:"المستخدم",th_role:"الدور",th_status:"الحالة",th_date:"تاريخ الإنشاء",th_actions:"إجراءات",loading:"جارٍ تحميل المستخدمين...",none:"لا يوجد مستخدمون.",active:"نشط",inactive:"غير نشط",edit:"تعديل",delete:"حذف",cancel:"إلغاء",save:"حفظ",saving:"جارٍ الحفظ...",close:"إغلاق",you:"أنت",readonly:"وضع القراءة فقط: يمكن لمدير النظام وحده إضافة المستخدمين أو تعديلهم أو حذفهم.",modal_new:"مستخدم جديد",modal_edit:"تعديل المستخدم",f_name:"الاسم الكامل",f_email:"البريد الإلكتروني",f_password:"كلمة المرور",f_password_hint:"اتركه فارغًا للاحتفاظ بكلمة المرور الحالية (عند التعديل).",f_role:"الدور",f_status:"الحالة",delete_title:"حذف هذا المستخدم؟",delete_warn:"هذا الإجراء لا يمكن التراجع عنه. سيفقد المستخدم الوصول إلى النظام فوراً.",delete_confirm:"نعم، احذف",ok_saved:"تم حفظ المستخدم بنجاح.",ok_updated:"تم تحديث الدور. يجب على المستخدم تسجيل الخروج ثم الدخول مجددًا.",ok_deleted:"تم حذف المستخدم.",err_save:"حدث خطأ أثناء الحفظ.",err_delete:"حدث خطأ أثناء الحذف.",err_load:"تعذّر تحميل المستخدمين.",err_forbidden:"هذا الإجراء مخصص لمدير النظام فقط."}},P="gestistock_lang",A=()=>({name:"",email:"",password:"",role:"cashier",status:"active"}),ee=(m,x)=>m?new Date(m).toLocaleDateString(x,{day:"2-digit",month:"short",year:"numeric"}):"—",p=m=>String(m||"").trim().toLowerCase(),re=({user:m})=>{const{lang:x}=Z(),t=q[x]||q.fr,[d,N]=s.useState(m||null);s.useEffect(()=>{if(m){N(m);return}let a=!0;return(async()=>{const{data:{session:o}}=await G.auth.getSession();if(!o?.user)return;const{data:l}=await G.from("profiles").select("role, status, name").eq("id",o.user.id).single();a&&N({id:o.user.id,email:o.user.email,name:l?.name||o.user.user_metadata?.name||o.user.email,role:p(l?.role||o.user.user_metadata?.role||"cashier"),status:l?.status||"active"})})(),()=>{a=!1}},[m]);const i=["admin","administrateur","administrator"].includes(p(d?.role))&&p(d?.status||"active")==="active",z=a=>!!d&&(String(a.id)===String(d.id)||a.email&&d.email&&a.email.toLowerCase()===d.email.toLowerCase());s.useEffect(()=>{try{localStorage.setItem(P,x)}catch{}},[x]);const[U,$]=s.useState([]),[W,D]=s.useState(!0),[F,I]=s.useState(""),[v,B]=s.useState(""),[w,O]=s.useState("all"),[S,y]=s.useState(!1),[C,E]=s.useState(!1),[n,g]=s.useState(null),[c,f]=s.useState(A()),[j,_]=s.useState(!1),[b,R]=s.useState({show:!1,message:"",type:"success"}),u=(a,r="success")=>{R({show:!0,message:a,type:r}),setTimeout(()=>{R({show:!1,message:"",type:"success"})},3e3)},L=async()=>{D(!0),I("");try{const a=await k.getAll(),r=Array.isArray(a)?a:Array.isArray(a?.data)?a.data:a?.data?.data||[];if($(r),d?.email){const o=r.find(l=>l.email&&l.email.toLowerCase()===d.email.toLowerCase());o?.role&&p(o.role)!==p(d.role)&&N(l=>l&&{...l,role:p(o.role)})}}catch(a){console.error(a),I(t.err_load)}finally{D(!1)}};s.useEffect(()=>{d&&L()},[d]);const h=()=>{y(!1),E(!1)};s.useEffect(()=>{if(!S&&!C)return;const a=r=>{r.key==="Escape"&&h()};return window.addEventListener("keydown",a),()=>window.removeEventListener("keydown",a)},[S,C]);const T=()=>{i&&(g(null),f(A()),y(!0))},H=a=>{i&&(g(a),f({name:a.name||"",email:a.email||"",password:"",role:p(a.role)||"cashier",status:a.status||"active"}),y(!0))},K=a=>{!i||z(a)||(g(a),E(!0))},V=async a=>{if(a.preventDefault(),!i){u(t.err_forbidden,"danger");return}_(!0);try{const r={...c};n&&!r.password&&delete r.password,n?(await k.update(n.id,r),u(t.ok_updated)):(await k.create(r),u(t.ok_saved)),y(!1),g(null),f(A()),await L()}catch(r){console.error("Erreur sauvegarde utilisateur :",r),u(r.message||t.err_save,"danger")}finally{_(!1)}},J=async()=>{if(!(!i||!n||z(n))){_(!0);try{await k.delete(n.id),E(!1),g(null),u(t.ok_deleted),await L()}catch(a){console.error("Erreur suppression utilisateur :",a),u(a.message||t.err_delete,"danger")}finally{_(!1)}}},Q=a=>({admin:t.role_admin,administrateur:t.role_admin,administrator:t.role_admin,manager:t.role_manager,cashier:t.role_cashier,stock:t.role_stock})[p(a)]||a,X=a=>{switch(p(a)){case"admin":case"administrateur":case"administrator":return"badge-rose";case"manager":return"badge-violet";case"stock":return"badge-amber";default:return"badge-blue"}},M=s.useMemo(()=>{const a=v.toLowerCase();return U.filter(r=>{const o=!v||(r.name||"").toLowerCase().includes(a)||(r.email||"").toLowerCase().includes(a),l=w==="all"||p(r.role)===p(w);return o&&l})},[U,v,w]),Y=i?5:4;return e.jsxs("div",{className:"ep-page",dir:t.dir,lang:x,children:[e.jsx("link",{rel:"stylesheet",href:"https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"}),e.jsx("style",{children:`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap');

        .ep-page {
          --ink: #14213d;
          --muted: #66748b;
          --line: #e3e9f2;
          --bg: #f8fafc;
          --card: #ffffff;
          --primary: #1f5eea;
          --primary-soft: #e8efff;
          --green: #0f9d74;
          --green-soft: #def7ee;
          --violet: #6a4de0;
          --violet-soft: #ece8fd;
          --amber: #e08a0b;
          --amber-soft: #fff0d6;
          --red: #d63c4a;
          --red-soft: #fde8ea;
          --rose: #c2417c;
          --rose-soft: #fbe6f0;
          --fs-xs: clamp(12px, 0.75vw + 9px, 14px);
          --fs-sm: clamp(13px, 0.80vw + 10px, 15px);
          --fs-md: clamp(14px, 0.85vw + 11px, 16px);
          --fs-lg: clamp(16px, 1vw + 12px, 20px);
          --fs-xl: clamp(19px, 1.2vw + 13px, 24px);
          --fs-2xl: clamp(23px, 1.6vw + 15px, 32px);
          width: 100%;
          min-height: 100vh;
          padding: clamp(10px, 2vw, 22px);
          background: var(--bg);
          color: var(--ink);
          font-family: Inter, 'Segoe UI', system-ui, sans-serif;
          font-size: var(--fs-md);
          -webkit-text-size-adjust: 100%;
        }
        .ep-page[lang="ar"] {
          font-family: Cairo, 'Segoe UI', Tahoma, sans-serif;
          line-height: 1.7;
        }
        .ep-page *,
        .ep-page *::before,
        .ep-page *::after {
          box-sizing: border-box;
        }
        .ep-page button,
        .ep-page input,
        .ep-page select {
          font: inherit;
        }
        .ep-page button {
          touch-action: manipulation;
        }
        .ep-page button:focus-visible,
        .ep-page input:focus-visible,
        .ep-page select:focus-visible {
          outline: 3px solid rgba(31, 94, 234, .3);
          outline-offset: 2px;
        }
        .ep-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 14px;
          margin-bottom: 20px;
        }
        .ep-title {
          min-width: 0;
          flex: 1;
        }
        .ep-title h1 {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          margin: 0 0 7px;
          font-size: var(--fs-2xl);
          font-weight: 800;
          line-height: 1.35;
          overflow-wrap: anywhere;
        }
        .ep-title p {
          margin: 0;
          color: var(--muted);
          font-size: var(--fs-md);
          line-height: 1.7;
        }
        .ep-btn-add {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          min-height: 44px;
          padding: 11px 18px;
          border: none;
          border-radius: 10px;
          background: var(--primary);
          color: #fff;
          font-size: var(--fs-md);
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(31, 94, 234, .2);
          transition: .2s;
        }
        .ep-btn-add:hover {
          transform: translateY(-2px);
          filter: brightness(.95);
        }
        .ep-notice {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 16px;
          padding: 13px 16px;
          border: 1px solid #f5dcb0;
          border-radius: 11px;
          background: var(--amber-soft);
          color: #94590a;
          font-size: var(--fs-sm);
          line-height: 1.7;
        }
        .ep-notice i {
          margin-top: 5px;
          flex-shrink: 0;
        }
        .ep-card {
          width: 100%;
          overflow: hidden;
          border: 1px solid var(--line);
          border-radius: 16px;
          background: var(--card);
          box-shadow: 0 4px 14px rgba(20, 33, 61, .04);
        }
        .ep-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          padding: 15px clamp(12px, 2vw, 20px);
          border-bottom: 1px solid var(--line);
        }
        .ep-input {
          width: 100%;
          min-width: 0;
          height: 46px;
          padding: 0 14px;
          border: 1px solid #d9e1ed;
          border-radius: 9px;
          background: #fff;
          color: #2a3a55;
          font-size: max(16px, var(--fs-md));
          outline: none;
          transition: .2s;
        }
        .ep-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px var(--primary-soft);
        }
        .ep-search-group {
          position: relative;
          flex: 1 1 260px;
          min-width: 0;
        }
        .ep-search-group .ep-input {
          padding-inline-start: 42px;
        }
        .ep-search-group i {
          position: absolute;
          top: 50%;
          inset-inline-start: 15px;
          transform: translateY(-50%);
          color: var(--muted);
          pointer-events: none;
        }
        .ep-filters select.ep-input {
          flex: 0 1 240px;
          min-width: 160px;
        }
        .ep-table-wrap {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        .ep-table {
          width: 100%;
          min-width: 720px;
          border-collapse: collapse;
        }
        .ep-table th {
          padding: 15px 18px;
          border-bottom: 1px solid var(--line);
          background: #f8fafc;
          color: var(--muted);
          text-align: start;
          font-size: var(--fs-xs);
          font-weight: 800;
          white-space: nowrap;
        }
        .ep-table td {
          padding: 15px 18px;
          border-bottom: 1px solid var(--line);
          font-size: var(--fs-sm);
          vertical-align: middle;
        }
        .ep-table tr:last-child td {
          border-bottom: none;
        }
        .ep-table tbody tr:hover td {
          background: #fbfcff;
        }
        .ep-col-end {
          text-align: end !important;
        }
        .user-cell {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }
        .user-avatar {
          display: flex;
          flex: 0 0 auto;
          align-items: center;
          justify-content: center;
          width: clamp(36px, 3.5vw, 44px);
          height: clamp(36px, 3.5vw, 44px);
          border-radius: 11px;
          background: var(--primary-soft);
          color: var(--primary);
          font-size: var(--fs-lg);
          font-weight: 800;
        }
        .user-name {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 7px;
          color: var(--ink);
          font-size: var(--fs-md);
          font-weight: 700;
          overflow-wrap: anywhere;
        }
        .user-email {
          margin-top: 3px;
          color: var(--muted);
          font-size: var(--fs-xs);
          overflow-wrap: anywhere;
        }
        .self-tag {
          padding: 3px 8px;
          border-radius: 99px;
          background: var(--primary-soft);
          color: var(--primary);
          font-size: var(--fs-xs);
          font-weight: 800;
        }
        .ep-badge {
          display: inline-flex;
          align-items: center;
          padding: 6px 11px;
          border-radius: 99px;
          font-size: var(--fs-xs);
          font-weight: 700;
          white-space: nowrap;
        }
        .badge-blue {
          background: var(--primary-soft);
          color: var(--primary);
        }
        .badge-green {
          background: var(--green-soft);
          color: var(--green);
        }
        .badge-rose {
          background: var(--rose-soft);
          color: var(--rose);
        }
        .badge-violet {
          background: var(--violet-soft);
          color: var(--violet);
        }
        .badge-amber {
          background: var(--amber-soft);
          color: #94590a;
        }
        .badge-gray {
          background: #f1f5f9;
          color: #64748b;
        }
        .status-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          margin-inline-end: 6px;
          border-radius: 50%;
        }
        .dot-green {
          background: var(--green);
        }
        .dot-gray {
          background: #94a3b8;
        }
        .ep-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }
        .btn-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border: 1px solid transparent;
          border-radius: 9px;
          background: transparent;
          color: #64748b;
          font-size: var(--fs-sm);
          cursor: pointer;
          transition: .2s;
        }
        .btn-edit {
          border-color: #c9daff;
          background: var(--primary-soft);
          color: var(--primary);
        }
        .btn-edit:hover {
          background: var(--primary);
          color: white;
        }
        .btn-delete {
          border-color: #f6c8cd;
          background: var(--red-soft);
          color: var(--red);
        }
        .btn-delete:hover {
          background: var(--red);
          color: white;
        }
        .btn-delete:disabled {
          opacity: .35;
          cursor: not-allowed;
        }
        .ep-modal-overlay {
          position: fixed;
          z-index: 1050;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          background: rgba(15, 23, 42, .6);
          backdrop-filter: blur(4px);
        }
        .ep-modal {
          display: flex;
          flex-direction: column;
          width: 100%;
          max-width: 520px;
          max-height: calc(100dvh - 32px);
          overflow: hidden;
          border-radius: 16px;
          background: white;
          box-shadow: 0 20px 40px rgba(0, 0, 0, .2);
          animation: modalIn .2s ease;
        }
        @keyframes modalIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .ep-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 16px 20px;
          border-bottom: 1px solid var(--line);
          background: #f8fafc;
        }
        .ep-modal-header h3 {
          margin: 0;
          font-size: var(--fs-lg);
          font-weight: 800;
        }
        .btn-close {
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 auto;
          width: 38px;
          height: 38px;
          border: none;
          border-radius: 8px;
          background: transparent;
          color: var(--muted);
          font-size: var(--fs-lg);
          cursor: pointer;
        }
        .btn-close:hover {
          background: #eef2f8;
        }
        .ep-modal-body {
          padding: clamp(15px, 2.5vw, 22px);
          overflow-y: auto;
          overscroll-behavior: contain;
        }
        .form-group {
          margin-bottom: 17px;
          min-width: 0;
        }
        .form-group label {
          display: block;
          margin-bottom: 7px;
          color: #4b5b75;
          font-size: var(--fs-sm);
          font-weight: 700;
        }
        .form-control {
          width: 100%;
          min-width: 0;
          height: 46px;
          padding: 0 14px;
          border: 1px solid #d9e1ed;
          border-radius: 9px;
          background: #fbfcfe;
          color: #2a3a55;
          font-size: max(16px, var(--fs-md));
          outline: none;
          transition: .2s;
        }
        .form-control:focus {
          border-color: var(--primary);
          background: white;
          box-shadow: 0 0 0 3px var(--primary-soft);
        }
        .form-hint {
          display: block;
          margin-top: 5px;
          color: var(--muted);
          font-size: var(--fs-xs);
          line-height: 1.6;
        }
        .form-grid2 {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }
        .ep-modal-footer {
          display: flex;
          justify-content: flex-end;
          flex-wrap: wrap;
          gap: 10px;
          padding: 14px 20px;
          border-top: 1px solid var(--line);
          background: #f8fafc;
        }
        .btn-cancel,
        .btn-save,
        .btn-danger {
          min-height: 44px;
          padding: 10px 18px;
          border-radius: 9px;
          font-size: var(--fs-sm);
          font-weight: 700;
          cursor: pointer;
          transition: .2s;
        }
        .btn-cancel {
          border: 1px solid var(--line);
          background: white;
          color: var(--ink);
        }
        .btn-save {
          border: none;
          background: var(--primary);
          color: white;
        }
        .btn-danger {
          border: none;
          background: var(--red);
          color: white;
        }
        .btn-save:disabled,
        .btn-danger:disabled {
          opacity: .6;
          cursor: not-allowed;
        }
        .empty-state {
          padding: 50px 20px !important;
          color: var(--muted);
          text-align: center;
          font-size: var(--fs-sm);
        }
        .empty-state h4 {
          font-size: var(--fs-lg);
        }
        .empty-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 64px;
          height: 64px;
          margin: 0 auto 16px;
          border-radius: 50%;
          background: var(--primary-soft);
          color: var(--primary);
          font-size: var(--fs-xl);
        }
        .ep-spinner {
          display: inline-block;
          width: 25px;
          height: 25px;
          border: 3px solid #dbeafe;
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: ep-spin .75s linear infinite;
        }
        @keyframes ep-spin {
          to {
            transform: rotate(360deg);
          }
        }
        .toast-container {
          position: fixed;
          z-index: 1100;
          top: 16px;
          inset-inline-end: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: max-content;
          max-width: calc(100vw - 32px);
        }
        .toast {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px 18px;
          border-inline-start: 4px solid var(--primary);
          border-radius: 10px;
          background: white;
          box-shadow: 0 10px 30px rgba(0, 0, 0, .1);
          font-size: var(--fs-sm);
          font-weight: 600;
          overflow-wrap: anywhere;
          animation: slideIn .3s ease;
        }
        .toast.success {
          border-inline-start-color: var(--green);
        }
        .toast.danger {
          border-inline-start-color: var(--red);
        }
        @keyframes slideIn {
          from {
            transform: translateY(-12px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @media (max-width: 992px) {
          .ep-page {
            padding: 16px;
          }
          .ep-table th,
          .ep-table td {
            padding: 13px 14px;
          }
        }
        @media (max-width: 560px) {
          .ep-page {
            padding: 12px;
            font-size: 15px;
          }
          .ep-header {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }
          .ep-title h1 {
            font-size: clamp(22px, 6vw, 27px);
            gap: 9px;
          }
          .ep-title p {
            font-size: 14px;
            line-height: 1.8;
          }
          .ep-btn-add {
            width: 100%;
            min-height: 47px;
            font-size: 15px;
          }
          .ep-filters {
            flex-direction: column;
            padding: 12px;
          }
          .ep-search-group,
          .ep-filters select.ep-input {
            flex: 1 1 auto;
            width: 100%;
            min-width: 0;
          }
          .ep-input,
          .form-control {
            min-height: 46px;
            font-size: 16px;
          }
          .ep-table {
            min-width: 720px;
          }
          .ep-table th {
            font-size: 12px;
          }
          .ep-table td {
            font-size: 14px;
          }
          .user-name {
            font-size: 14px;
          }
          .user-email {
            font-size: 12px;
          }
          .ep-badge {
            font-size: 12px;
          }
          .form-grid2 {
            grid-template-columns: 1fr;
            gap: 0;
          }
          .ep-modal-overlay {
            align-items: flex-end;
            padding: 0;
          }
          .ep-modal {
            max-width: none;
            max-height: 90dvh;
            border-radius: 18px 18px 0 0;
          }
          .ep-modal-header {
            padding: 14px 16px;
          }
          .ep-modal-body {
            padding: 16px;
          }
          .ep-modal-footer {
            padding: 12px;
          }
          .ep-modal-footer .btn-cancel,
          .ep-modal-footer .btn-save,
          .ep-modal-footer .btn-danger {
            flex: 1;
          }
          .toast-container {
            top: 10px;
            inset-inline: 10px;
            width: auto;
            max-width: none;
          }
          .toast {
            font-size: 13px;
          }
        }
        @media (max-width: 380px) {
          .ep-page {
            padding: 8px;
          }
          .ep-title h1 {
            font-size: 21px;
          }
          .ep-title p {
            font-size: 13px;
          }
          .ep-table {
            min-width: 680px;
          }
          .ep-modal-footer {
            gap: 7px;
            padding: 10px;
          }
          .btn-cancel,
          .btn-save,
          .btn-danger {
            padding: 9px 10px;
            font-size: 13px;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .ep-spinner {
            animation-duration: 2s;
          }
          .ep-modal,
          .toast {
            animation: none;
          }
          .ep-btn-add,
          .btn-icon {
            transition: none;
          }
        }
      `}),e.jsxs("div",{className:"ep-header",children:[e.jsxs("div",{className:"ep-title",children:[e.jsxs("h1",{children:[e.jsx("i",{className:"fas fa-users",style:{color:"var(--primary)"}}),t.title]}),e.jsx("p",{children:t.subtitle})]}),i&&e.jsxs("button",{type:"button",className:"ep-btn-add",onClick:T,children:[e.jsx("i",{className:"fas fa-user-plus"}),t.add]})]}),!i&&e.jsxs("div",{className:"ep-notice",role:"status",children:[e.jsx("i",{className:"fas fa-lock"}),e.jsx("span",{children:t.readonly})]}),F&&e.jsxs("div",{className:"toast danger",style:{marginBottom:20},role:"alert",children:[e.jsx("i",{className:"fas fa-exclamation-circle"}),F]}),e.jsxs("div",{className:"ep-card",children:[e.jsxs("div",{className:"ep-filters",children:[e.jsxs("div",{className:"ep-search-group",children:[e.jsx("i",{className:"fas fa-search"}),e.jsx("input",{type:"search",className:"ep-input",placeholder:t.search_ph,"aria-label":t.search_ph,value:v,onChange:a=>B(a.target.value)})]}),e.jsxs("select",{className:"ep-input","aria-label":t.th_role,value:w,onChange:a=>O(a.target.value),children:[e.jsx("option",{value:"all",children:t.all_roles}),e.jsx("option",{value:"admin",children:t.role_admin}),e.jsx("option",{value:"manager",children:t.role_manager}),e.jsx("option",{value:"cashier",children:t.role_cashier}),e.jsx("option",{value:"stock",children:t.role_stock})]})]}),e.jsx("div",{className:"ep-table-wrap",children:e.jsxs("table",{className:"ep-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:t.th_name}),e.jsx("th",{children:t.th_role}),e.jsx("th",{children:t.th_status}),e.jsx("th",{children:t.th_date}),i&&e.jsx("th",{className:"ep-col-end",children:t.th_actions})]})}),e.jsx("tbody",{children:W?e.jsx("tr",{children:e.jsxs("td",{colSpan:Y,className:"empty-state",children:[e.jsx("span",{className:"ep-spinner",role:"status","aria-label":t.loading}),e.jsx("p",{style:{marginTop:10},children:t.loading})]})}):M.length===0?e.jsx("tr",{children:e.jsxs("td",{colSpan:Y,className:"empty-state",children:[e.jsx("div",{className:"empty-icon",children:e.jsx("i",{className:"fas fa-user-slash"})}),e.jsx("h4",{style:{margin:"0 0 8px",color:"var(--ink)"},children:t.none}),i&&e.jsx("button",{className:"btn-save",onClick:T,style:{marginTop:10},children:t.add})]})}):M.map(a=>{const r=z(a);return e.jsxs("tr",{children:[e.jsx("td",{children:e.jsxs("div",{className:"user-cell",children:[e.jsx("div",{className:"user-avatar",children:a.name?a.name.charAt(0).toUpperCase():"U"}),e.jsxs("div",{children:[e.jsxs("div",{className:"user-name",children:[a.name,r&&e.jsx("span",{className:"self-tag",children:t.you})]}),e.jsxs("div",{className:"user-email",children:[e.jsx("i",{className:"fas fa-envelope",style:{fontSize:11,marginInlineEnd:4}}),a.email]})]})]})}),e.jsx("td",{children:e.jsx("span",{className:`ep-badge ${X(a.role)}`,children:Q(a.role)})}),e.jsx("td",{children:e.jsxs("span",{className:`ep-badge ${a.status==="active"?"badge-green":"badge-gray"}`,children:[e.jsx("span",{className:`status-dot ${a.status==="active"?"dot-green":"dot-gray"}`}),a.status==="active"?t.active:t.inactive]})}),e.jsx("td",{style:{color:"var(--muted)"},children:ee(a.created_at,x==="ar"?"ar-EG":"fr-FR")}),i&&e.jsx("td",{children:e.jsxs("div",{className:"ep-actions",children:[e.jsx("button",{type:"button",className:"btn-icon btn-edit",onClick:()=>H(a),title:t.edit,"aria-label":t.edit,children:e.jsx("i",{className:"fas fa-pen"})}),e.jsx("button",{type:"button",className:"btn-icon btn-delete",onClick:()=>K(a),disabled:r,title:t.delete,"aria-label":t.delete,children:e.jsx("i",{className:"fas fa-trash-alt"})})]})})]},a.id)})})]})})]}),i&&S&&e.jsx("div",{className:"ep-modal-overlay",onMouseDown:a=>a.target===a.currentTarget&&h(),children:e.jsxs("div",{className:"ep-modal",dir:t.dir,role:"dialog","aria-modal":"true","aria-labelledby":"up-form-title",children:[e.jsxs("div",{className:"ep-modal-header",children:[e.jsx("h3",{id:"up-form-title",children:n?t.modal_edit:t.modal_new}),e.jsx("button",{type:"button",className:"btn-close",onClick:h,"aria-label":t.close,children:e.jsx("i",{className:"fas fa-times"})})]}),e.jsxs("form",{onSubmit:V,style:{display:"flex",flexDirection:"column",minHeight:0},children:[e.jsxs("div",{className:"ep-modal-body",children:[e.jsxs("div",{className:"form-group",children:[e.jsx("label",{htmlFor:"up-name",children:t.f_name}),e.jsx("input",{id:"up-name",type:"text",className:"form-control",required:!0,value:c.name,onChange:a=>f({...c,name:a.target.value})})]}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{htmlFor:"up-email",children:t.f_email}),e.jsx("input",{id:"up-email",type:"email",className:"form-control",required:!0,value:c.email,onChange:a=>f({...c,email:a.target.value}),dir:"ltr",style:{textAlign:t.dir==="rtl"?"right":"left"}})]}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{htmlFor:"up-password",children:t.f_password}),e.jsx("input",{id:"up-password",type:"password",className:"form-control",required:!n,value:c.password,onChange:a=>f({...c,password:a.target.value}),dir:"ltr",autoComplete:"new-password"}),n&&e.jsx("span",{className:"form-hint",children:t.f_password_hint})]}),e.jsxs("div",{className:"form-grid2",children:[e.jsxs("div",{className:"form-group",children:[e.jsx("label",{htmlFor:"up-role",children:t.f_role}),e.jsxs("select",{id:"up-role",className:"form-control",value:c.role,onChange:a=>f({...c,role:a.target.value}),children:[e.jsx("option",{value:"admin",children:t.role_admin}),e.jsx("option",{value:"manager",children:t.role_manager}),e.jsx("option",{value:"cashier",children:t.role_cashier}),e.jsx("option",{value:"stock",children:t.role_stock})]})]}),e.jsxs("div",{className:"form-group",children:[e.jsx("label",{htmlFor:"up-status",children:t.f_status}),e.jsxs("select",{id:"up-status",className:"form-control",value:c.status,onChange:a=>f({...c,status:a.target.value}),children:[e.jsx("option",{value:"active",children:t.active}),e.jsx("option",{value:"inactive",children:t.inactive})]})]})]})]}),e.jsxs("div",{className:"ep-modal-footer",children:[e.jsx("button",{type:"button",className:"btn-cancel",onClick:h,children:t.cancel}),e.jsx("button",{type:"submit",className:"btn-save",disabled:j,children:j?e.jsxs(e.Fragment,{children:[e.jsx("i",{className:"fas fa-spinner fa-spin"})," "," "," ",t.saving]}):t.save})]})]})]})}),i&&C&&n&&e.jsx("div",{className:"ep-modal-overlay",onMouseDown:a=>a.target===a.currentTarget&&h(),children:e.jsxs("div",{className:"ep-modal",dir:t.dir,style:{maxWidth:420},role:"alertdialog","aria-modal":"true",children:[e.jsxs("div",{className:"ep-modal-body",style:{textAlign:"center",paddingTop:30},children:[e.jsx("div",{className:"empty-icon",style:{background:"var(--red-soft)",color:"var(--red)"},children:e.jsx("i",{className:"fas fa-exclamation-triangle"})}),e.jsx("h3",{style:{margin:"0 0 10px",fontSize:"var(--fs-xl)"},children:t.delete_title}),e.jsx("p",{style:{color:"var(--muted)",margin:"0 0 16px",fontSize:"var(--fs-sm)",lineHeight:1.7},children:t.delete_warn}),e.jsxs("div",{style:{background:"#f8fafc",padding:12,borderRadius:8,fontWeight:700,marginBottom:20,fontSize:"var(--fs-md)",overflowWrap:"anywhere"},children:[n.name,e.jsx("br",{}),e.jsx("span",{style:{fontWeight:400,fontSize:"var(--fs-xs)",color:"var(--muted)"},children:n.email})]})]}),e.jsxs("div",{className:"ep-modal-footer",style:{justifyContent:"center"},children:[e.jsx("button",{type:"button",className:"btn-cancel",onClick:h,children:t.cancel}),e.jsx("button",{type:"button",className:"btn-danger",onClick:J,disabled:j,children:j?e.jsx("i",{className:"fas fa-spinner fa-spin"}):t.delete_confirm})]})]})}),b.show&&e.jsx("div",{className:"toast-container",role:"status",children:e.jsxs("div",{className:`toast ${b.type}`,children:[e.jsx("i",{className:`fas ${b.type==="success"?"fa-check-circle":"fa-exclamation-circle"}`,style:{color:b.type==="success"?"var(--green)":"var(--red)"}}),b.message]})})]})};export{re as default};
