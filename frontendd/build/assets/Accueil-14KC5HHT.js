import{u,a as v,r as o,j as e}from"./index-BPK71jDm.js";import{F as k,a as y,b as C,c as N}from"./index-Bnc-dP6y.js";import{c as a,p as $,P as c}from"./styled-components.browser.esm-D7KAYp4v.js";import{C as x}from"./Container-PhyxBpdZ.js";import{B as S}from"./Badge-BuId90XF.js";import{R as T,C as B}from"./Row-DUzpixzZ.js";const b=$`
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
`,F=a.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #e3edf9 0%, #f0f4fb 100%);
  display: flex;
  flex-direction: column;
`,L=a.header`
  background: linear-gradient(135deg, #0d47a1 0%, #1976d2 100%);
  color: white;
  padding: 3rem 0 4rem 0;
  position: relative;
  overflow: hidden;
  margin-bottom: 2rem;

  &::after {
    content: "";
    position: absolute;
    bottom: -40px;
    left: 0;
    width: 100%;
    height: 80px;
    background: white;
    border-radius: 50% 50% 0 0;
  }
`,M=a.h1`
  font-weight: 700;
  font-size: clamp(1.8rem, 4vw, 2.5rem);
  animation: ${b} 0.8s ease;
`,R=a.p`
  opacity: 0.9;
  margin-top: 0.5rem;
  animation: ${b} 1s ease;
`,q=a.div`
  background: white;
  border-radius: 50px;
  padding: 0.4rem 1rem;
  display: flex;
  align-items: center;
  max-width: 400px;
  margin: 1.5rem auto 0;
  box-shadow: 0 6px 18px rgba(0,0,0,0.08);

  input {
    border: none;
    outline: none;
    flex: 1;
    padding: 0.4rem;
    color: #0d47a1;
  }

  svg {
    color: #1976d2;
  }
`,Y=a.div`
  background: white;
  border-radius: 15px;
  padding: 1rem 1.2rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 6px 20px rgba(0,0,0,0.05);
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  align-items: center;
`,z=a.button`
  background: #e3f2fd;
  border: none;
  color: #0d47a1;
  padding: 0.4rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  transition: 0.3s;

  &:hover {
    background: #1976d2;
    color: white;
  }
`,P=a.div`
  width: 100%;
  margin-bottom: 1.5rem;

  button {
    width: 100%;
    height: 120px;
    background: linear-gradient(135deg, #6ea8d3 0%, #5b9bc8 100%);
    border: 3px solid #0d47a1;
    border-radius: 20px;
    box-shadow: 0 8px 18px rgba(13, 71, 161, 0.25);
    transition: all 0.3s ease-in-out;
    cursor: pointer;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;

    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 12px 25px rgba(13, 71, 161, 0.35);
    }

    img {
      width: 55px;
      height: 55px;
      object-fit: contain;
    }

    span {
      color: white;
      font-weight: 600;
      font-size: 1rem;
      text-align: center;
    }
  }
`,f=({imageSrc:n,text:l,link:r,viewMode:t})=>{const i=u();return e.jsx(B,{xs:12,sm:t==="grid"?6:12,md:t==="grid"?4:12,lg:t==="grid"?3:12,children:e.jsx(P,{children:e.jsxs("button",{onClick:()=>i(r),children:[n&&e.jsx("img",{src:n,alt:""}),e.jsx("span",{children:l})]})})})};f.propTypes={imageSrc:c.string,text:c.string.isRequired,link:c.string.isRequired,viewMode:c.string.isRequired};const A=({userName:n})=>{const l=u(),r=v()||{},t=typeof r.t=="function"?r.t:s=>s,i=r.lang||"fr",[p,j]=o.useState(""),[d,m]=o.useState("grid"),h=o.useMemo(()=>[{text:t("ventes"),img:"https://cdn-icons-png.flaticon.com/128/5442/5442020.png",path:"/ventes"},{text:t("achat"),img:"https://cdn-icons-png.flaticon.com/128/2821/2821739.png",path:"/achat"},{text:t("stock"),img:"https://cdn-icons-png.flaticon.com/128/4408/4408296.png",path:"/products"},{text:t("expense"),img:"https://cdn-icons-png.flaticon.com/128/2041/2041643.png",path:"/expenses"},{text:t("categories"),img:"https://cdn-icons-png.flaticon.com/128/2041/2041643.png",path:"/categories"},{text:t("rapports"),img:"https://cdn-icons-png.flaticon.com/128/18220/18220264.png",path:"/rapportss"},{text:t("customers"),img:"https://cdn-icons-png.flaticon.com/128/18220/18220264.png",path:"/customers"},{text:t("caisse"),img:"https://cdn-icons-png.flaticon.com/128/18220/18220264.png",path:"/gestionC"},{text:t("deposits"),img:"https://cdn-icons-png.flaticon.com/128/18220/18220264.png",path:"/depo"}],[t,i]),w=o.useMemo(()=>[{label:t("vente"),path:"/ventes"},{label:t("achat"),path:"/achat"},{label:t("produit"),path:"/products"},{label:t("fournisseurs"),path:"/suppliers"},{label:t("clients"),path:"/customers"},{label:t("categories"),path:"/categories"},{label:t("expense"),path:"/expenses"},{label:t("stock"),path:"/stock"},{label:t("utilisateurs"),path:"/users"},{label:t("rapports"),path:"/rapportss"},{label:t("caisse"),path:"/gestionC"},{label:t("deposits"),path:"/depo"}],[t,i]),g=o.useMemo(()=>h.filter(s=>s.text.toLowerCase().includes(p.toLowerCase())),[p,h]);return e.jsxs(F,{children:[e.jsx(L,{children:e.jsxs(x,{className:"text-center",children:[e.jsxs(M,{children:[t("welcome"),n?`, ${n}`:""]}),e.jsx(R,{children:t("subtitle")}),e.jsxs(q,{children:[e.jsx(k,{}),e.jsx("input",{type:"text",placeholder:t("searchModule"),value:p,onChange:s=>j(s.target.value)})]})]})}),e.jsxs(x,{className:"flex-grow-1",children:[e.jsxs(Y,{children:[e.jsx(y,{}),w.map(s=>e.jsx(z,{onClick:()=>l(s.path),children:s.label},`quick-${s.path}-${s.label}`)),e.jsxs("div",{className:"ms-auto d-flex gap-2",children:[e.jsx("button",{onClick:()=>m("grid"),className:`btn btn-sm ${d==="grid"?"btn-primary":"btn-light"}`,children:e.jsx(C,{})}),e.jsx("button",{onClick:()=>m("list"),className:`btn btn-sm ${d==="list"?"btn-primary":"btn-light"}`,children:e.jsx(N,{})})]})]}),e.jsxs("div",{className:"d-flex justify-content-between align-items-center mb-3",children:[e.jsx("h5",{className:"fw-semibold text-primary",children:t("applications")}),e.jsx(S,{bg:"primary",children:g.length})]}),g.length>0?e.jsx(T,{children:g.map(s=>e.jsx(f,{imageSrc:s.img,text:s.text,link:s.path,viewMode:d},`doc-${s.path}-${s.text}`))}):e.jsx("div",{className:"text-center py-5",children:e.jsx("h5",{className:"text-muted",children:t("noModule")})})]}),e.jsxs("footer",{className:"bg-dark text-white py-3 text-center mt-4",children:["© ",new Date().getFullYear()," ",i==="ar"?"جميع الحقوق محفوظة":"Tous droits réservés"]})]})};A.propTypes={userName:c.string};export{A as default};
