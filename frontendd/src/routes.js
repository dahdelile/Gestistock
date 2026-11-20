import React from 'react'

const AdminAc= React.lazy(() => import('./views/admin/adminAc/AdminAc'))
const AdminDashboard = React.lazy(() => import('./views/admin/gestion/AdminDashboard'))

const Dashboard = React.lazy(() => import('./views/dashboard/Dashboard'))
///usine  
const  PersonneUsine= React.lazy(() => import('./views/usine/personneUsine/PersonneUsine'))
const  Usines= React.lazy(() => import('./views/usine/anUsine/Usines'))
const  PieceU= React.lazy(() => import('./views/usine/anUsine/piece/PieceU'))

const  AfficheUsine= React.lazy(() => import('./views/usine/concasseur/afficheUsine/AfficheUsine'))
const  Concasseur= React.lazy(() => import('./views/usine/concasseur/conc/Concasseur'))
const AnaliseConcasseur= React.lazy(() => import('./views/usine/concasseur/analiseConcasseur/AnaliseConcasseur'))
const joutConcasseur = React.lazy(() => import('./views/usine/concasseur/ajoutConcasseur/AjoutConcasseur'))
const ArretUsine= React.lazy(() => import('./views/usine/arretUsine/ArretUsine'))

const RapportU= React.lazy(() => import('./views/usine/rapportA/RapportU'))

const AnaliseEnrobe= React.lazy(() => import('./views/usine\/enrobe/analiseEnrobe/AnaliseEnrobe'))
const AjoutEnrobe= React.lazy(() => import('./views/usine/enrobe/ajoutEnrobe/AjoutEnrobe.js'))
const Enrobe= React.lazy(() => import('./views/usine/enrobe/enro/Enrobe'))
const CodePanne= React.lazy(() => import('./views/panne/codepnne/CodePanne'))
//gasoil 
const AnaliseG = React.lazy(() => import('./views/gasoil/analiseG/AnaliseG'))

const AjGasoil = React.lazy(() => import('./views/gasoil/ajGasoil/AjGasoil'))
//NOTE
const NoteAddF = React.lazy(() => import('./views/noteDG/noteAddF/NoteAddF'))

const NoteDGT = React.lazy(() => import('./views/noteDG/noteTable/NoteDGT'))
const NoteDGF = React.lazy(() => import('./views/noteFile/NoteDGF'))
const NoteFile2025 = React.lazy(() => import('./views/noteDG/noteFile2025/NoteFile2025'))
const NoteFile2024 = React.lazy(() => import('./views/noteDG/noteFilee2024/NoteFile2024'))
//personne 

const AjoutPersonne= React.lazy(() => import('./views/personne/ajoutPersonne/AjoutPersonne'))
const ListPersonne= React.lazy(() => import('./views/personne/listPersonne/ListPersonne'))
//documents

const Excel= React.lazy(() => import('./views/documents/excel/Excel'))
const DGdoc= React.lazy(() => import('./views/documents/dgDoc/DGdoc'))
const DAAdoc= React.lazy(() => import('./views/documents/daaDoc/DAAdoc'))
const DCGdoc= React.lazy(() => import('./views/documents/dcgDoc/DCGdoc'))
const DMdoc= React.lazy(() => import('./views/documents/dmDoc/DMdoc'))
const DRCdoc= React.lazy(() => import('./views/documents/drcDoc/RCFdoc'))
const DRHdoc= React.lazy(() => import('./views/documents/drhDoc/DRHdoc'))
const DTdoc= React.lazy(() => import('./views/documents/dtDoc/DTdoc'))
const DPdoc= React.lazy(() => import('./views/documents/dpDoc/DPdoc'))
const GestionParc= React.lazy(() => import('./views/parc/GestionParc'))
const DocProjet= React.lazy(() => import('./views/documents/dProjets/DocProjet'))

//rj
const RapportJour= React.lazy(() => import('./views/panne/rapportJou/RapportJour'))
//maintenace
const AnalS= React.lazy(() => import('./views/maintenance/analS/AnalS.js'))
const RapportDM= React.lazy(() => import('./views/maintenance/rapportDM/RapportDM'))
const Engin= React.lazy(() => import('./views/maintenance/engin/Engin'))
const GestionMaint= React.lazy(() => import('./views/maintenance/gestionMaint/GestionMaint'))
const Service= React.lazy(() => import('./views/maintenance/service/Service'))
const ServiceCentral= React.lazy(() => import('./views/maintenance/serviceCentral/ServiceCentral'))
const Tecnic= React.lazy(() => import('./views/documents/tecnicDoc/Tecnic'))

//eginn
const FicheAvie= React.lazy(() => import('./views/engin/ficheAvie/FicheAvie'))

const ProductList= React.lazy(() => import('./views/Products/ProductList'))
const AjoutEngin= React.lazy(() => import('./views/engin/ajoutEngin/AjoutEngin'))
const ArretE= React.lazy(() => import('./views/engin/arretE/ArretE'))
const Enging= React.lazy(() => import('./views/engin/enging/Enging'))
const ServiceEngin= React.lazy(() => import('./views/engin/serviceEngin/ServiceEngin'))
//commentaires

const AjoutCom= React.lazy(() => import('./views/comentaires/ajoutCom/AjoutCom'))
const GesCom= React.lazy(() => import('./views/comentaires/gesCom/GesCom'))
//production


const ProdEq= React.lazy(() => import('./views/projet/prodEqui/ProdEq'))

/// procedures

const AlertV= React.lazy(() => import('./views/entretien/alert/AlertV'))
const AjouterEnt= React.lazy(() => import('./views/entretien/ajouteE/AjouterEnt'))
const ListEnt= React.lazy(() => import('./views/entretien/listEnt/ListEnt'))


const AjoutProcedure = React.lazy(() => import('./views/procedures/ajoutProcedure/AjoutProcedure'))
const DgPro= React.lazy(() => import('./views/procedures/dg/DgPro'))
const DaaPro= React.lazy(() => import('./views/procedures/daa/DaaPro'))
const DcgPro= React.lazy(() => import('./views/procedures/dcg/DcgPro'))
const DmPro= React.lazy(() => import('./views/procedures/dm/DmPro'))
const DrhPro= React.lazy(() => import('./views/procedures/drh/DrhPro'))
const DtPro= React.lazy(() => import('./views/procedures/dt/DtPro'))
const DrcfPro= React.lazy(() => import('./views/procedures/rcf/DrcfPro'))
///production

const AjoutProdVoi= React.lazy(() => import('./views/production/ajouteProVoi/AjoutProdVoi'))
const ListProdVoi= React.lazy(() => import('./views/production/listProdVoit/ListProdVoi'))

const ListCh= React.lazy(() => import('./views/production/listCh/ListCh'))
const Chauffeur= React.lazy(() => import('./views/production/chauffeur/Chauffeur'))
const AjChauffeur= React.lazy(() => import('./views/production/ajChauffeur/AjChauffeur'))
const ProdCh= React.lazy(() => import('./views/production/prodCh/ProdCh'))
const Organi= React.lazy(() => import('./views/organigrame/Organi'))
const Action= React.lazy(() => import('./views/plan/Action'))
const AjoutAction= React.lazy(() => import('./views/plan/ajoutAction/AjoutAction'))
//fiche
const Avie= React.lazy(() => import('./views/fiche/aVie/Avie'))
const ListVie= React.lazy(() => import('./views/fiche/listVie/ListVie'))
const   DocE= React.lazy(() => import('./views/fiche/docE/DocE'))
//projet
const Rapport= React.lazy(() => import('./views/projet/Rapport'))
const APerformance= React.lazy(() => import('./views/projet/aPerformance/APerformance'))
const AjoutProjet= React.lazy(() => import('./views/projet/ajoutProjet/AjoutProjet'))
const ProjetPerformances= React.lazy(() => import('./views/projet/performances/ProjetPerformances'))
const RapportM= React.lazy(() => import('./views/projet/rapportM/RapportM'))
const DetailP= React.lazy(() => import('./views/projet/detailP/DetailP'))
const Accueil = React.lazy(() => import('./views/home/accueil/Accueil'))
const AfChau= React.lazy(() => import('./views/projet/affectation/AfChau.js'))
const Afvoi= React.lazy(() => import('./views/projet/affectation/afvoi/Afvoi'))
// Buttons
//pneus
const ConsPneu= React.lazy(() => import('./views/pneus/consPneu/ConsPneu'))
const RapportPneu= React.lazy(() => import('./views/pneus/rapportPneu/RapportPneu'))
const Widgets = React.lazy(() => import('./views/widgets/Widgets'))
//instance
const Instance= React.lazy(() => import('./views/instance/Instance'))
const Pointage= React.lazy(() => import('./views/personne/pointage/Pointage'))
//gestion des groupes utilisateur
//const Groupe= React.lazy(() => import('./views/admin/groupe/Groupe'))
//const Users= React.lazy(() => import('./views/admin/users/Users'))
//caise
const Lcaise= React.lazy(() => import('./views/caise/lcaise/Lcaise'))
const Dcaise= React.lazy(() => import('./views/caise/dcaise/Dcaise'))
const Caise= React.lazy(() => import('./views/caise/listCaise/Caise'))
//budget//////
const Budget= React.lazy(() => import('./views/budget/listBudget/ListBudget'))
const BudgetProjet = React.lazy(() => import('./views/budget/budgetProjet/BudgetProjet'))
const Lprojet= React.lazy(() => import('./views/budget/lprojet/Lprojet'))
const GestDocumnt = React.lazy(() => import('./views/documents/gesDocument/GestDocumnt'))

const routes = [
{path: 'documents\/esDocument', name: 'GestDocumnt', element:GestDocumnt},
{path: '/caise/dcaise', name: 'Dcaise', element: Dcaise},
{path: '/caise/lcaise', name: 'Lcaise', element: Lcaise},

 
 {path: '/budgetProjet/BudgetProjet', name: 'BudgetProjet', element: BudgetProjet},
 {path: '/budget/lprojet', name: 'Lprojet', element: Lprojet},
 // {path: '/admin/users', name: 'Users', element: Users},
  //instance
{path: '/instance', name: 'Instance', element: Instance},
//pointage
{path: '/personne/pointage', name: 'Pointage', element: Pointage},
  { path: '/', exact: true, name: 'Dashboard' },
  { path: '/dashboard', name: 'Dashboard', element:  Dashboard},
  { path: '/Actualite', name: 'Note DG', element: NoteDGT, exact: true },
  { path: '/Actualite/noteDG', name: 'NoteDGT', element: NoteDGT },
 //production
 
 { path: '/panne/codepnne', name: 'CodePanne ', element: CodePanne },
 { path: '/panne/rapportJou', name: 'RapportJour ', element: RapportJour },
 { path: '/prodCh/ProdCh', name: 'ProdCh', element:  ProdCh},

 { path: '/prodEqui/ProdEq', name: 'ProdEq', element: ProdEq},

{ path: '/organigrame', name: 'Organi', element:  Organi},
//personne 
{ path: '/personne/listPersonne', name: 'ListPersonne', element:  ListPersonne},

{ path: '/personne/ajoutPersonne', name: 'AjoutPersonne', element:  AjoutPersonne},

//fiche
{ path: '/fiche/avie', name: 'Avie', element:  Avie},
{ path: '/fiche/listVie', name: 'ListVie', element:  ListVie},
{ path: '/fiche/docE', name: 'DocE', element:  DocE},
//

///commentaires 

{ path: '/comentaies/ajoutCom', name: 'AjoutCom', element:  AjoutCom},
{ path: '/comentaires/gesCom', name: 'GesCom', element:  GesCom},

//production
{ path: '/production/ajouteProVoi', name: 'AjoutProdVoi', element:  AjoutProdVoi},
{ path: '/production/listProdVoit', name: 'ListProdVoi', element:  ListProdVoi},
{ path: '/production/listch', name: 'ListCh', element:  ListCh},
{ path: '/production/chauffeur', name: 'Chauffeur', element:  Chauffeur},
{ path: '/production/ajChauffeur', name: 'AjChauffeur', element:  AjChauffeur},
{ path: '/production/prodCh', name: 'ProdCh', element:  ProdCh},
//entretient

{ path: '/entretien/alert', name: 'AlertV', element:  AlertV},
{ path: '/entretien/listEnt', name: 'ListEnt', element:  ListEnt},
{ path: '/entretien/ajouteE', name: 'AjouterEnt', element:  AjouterEnt},
//procedure
{ path: '/procedures/ajoutProcedure', name: 'AjoutProcedure', element:  AjoutProcedure},
{ path: '/procedures/dg', name: 'DgPro', element:  DgPro},

{ path: '/procedures/daa', name: 'DaaPro', element:  DaaPro},
{ path: '/procedures/dcg', name: 'DcgPro', element:  DcgPro},
{ path: '/procedures/drh', name: 'DrhPro', element:  DrhPro},
{ path: '/procedures/dm', name: 'DgPro', element:  DmPro},
{ path: '/procedures/dt', name: 'DgPro', element:  DtPro},
{ path: '/procedures/rcf', name: 'DrcfPro', element:  DrcfPro},
/// admin

{ path: '/admin/adminAc', name: 'AdminAc', element:   AdminAc },
  { path: '/admin/gestion', name: 'AdminDashboard', element:   AdminDashboard },


  { path: '/noteDG/noteAddF', name: 'NoteAddF', element: NoteAddF},
  { path: '/noteDG/noteTable', name: 'NoteDGT', element: NoteDGT },
//DOCUMENTS
{ path: '/documents/dgDoc', name: 'DGdoc', element:  DGdoc},

{ path: '/documents/tecnicDoc', name: 'Tecnic', element:  Tecnic},
//
{ path: '/documents/tecnicDoc', name: 'Tecnic', element:  Tecnic},


//GASOIL

{ path: '/gasoil/ajGasoil', name: 'AjGasoil', element:  AjGasoil},
{ path: '/gasoil/analiseG', name: 'AnaliseG', element:  AnaliseG},
//maintenance


{ path: '/maintenance/serviceCentral', name: 'ServiceCentral', element:  ServiceCentral},

{ path: '/maintenance/service', name: 'Service', element:  Service},
{ path: '/maintenance/analS', name: 'AnalS', element:  AnalS},
{ path: '/maintenance/engin', name: 'Engin', element:  Engin},
{ path: '/maintenance/gestionMaint', name: 'GestionMaint', element:  GestionMaint},
{ path: '/maintenance/rapportDM', name: 'RapportDM', element: RapportDM},
//usine 
{path: 'usine/rapportA', name: 'RapportU', element: RapportU},


{path: 'usine/arretUsine', name: 'ArretUsine', element: ArretUsine},
{path: 'usine/personneUsine', name: 'PersonneUsine', element: PersonneUsine},
{path: 'usine/concasseur/ajoutConcasseur', name: 'joutConcasseur', element: joutConcasseur},
{path: 'usine/concasseur/analiseConcasseur', name: 'AnaliseConcasseur', element:  AnaliseConcasseur},
{path: 'usine/concasseur/conc', name: 'Concasseur', element:  Concasseur},
{path: 'usine/anUsine/piece', name: 'PieceU', element:  PieceU},
{path: 'usine/anUsine', name: 'Usines', element:  Usines},

{path: 'usine/concasseur/afficheUsine', name: 'AfficheUsine', element:  AfficheUsine},



{path: 'usine/enrobe/ajoutEnrobe', name: 'AjoutEnrobe', element:  AjoutEnrobe},
{path: 'usine/enrobe/analiseEnrobe', name: 'AnaliseEnrobe', element:  AnaliseEnrobe},
{path: 'usine/enrobe/enro', name: 'Enrobe', element:  Enrobe},

{ path: 'Products', name: 'EntEngin', element:  ProductList},
{ path: 'engin/ajoutEngin', name: 'AjoutEngin', element:  AjoutEngin},
{ path: 'engin/serviceEngin', name: 'ServiceEngin', element:  ServiceEngin},
{ path: 'engin/Enging', name: 'Enging', element:  Enging},
{ path: 'engin/arretE', name: 'ArretE', element: ArretE},
{ path: '/engin/ficheAvie', name: 'FicheAvie', element: FicheAvie},


{ path: '/documents/dpDoc', name: 'DPdoc', element:  DPdoc},
{ path: '/documents/excel', name: 'Excel', element:  Excel},
{ path: '/documents/daaDoc', name: 'DAAdoc', element:  DAAdoc},
{ path: '/documents/dcgDoc', name: 'DCGdoc', element:  DCGdoc},
{ path: '/documents/dmDoc', name: 'DMdoc', element:  DMdoc},
{ path: '/documents/drcDoc', name: 'DRCdoc', element:  DRCdoc},
{ path: '/documents/drhDoc', name: 'DRHdoc', element:  DRHdoc},
{ path: '/documents/dtDoc', name: 'DTdoc', element:  DTdoc},




  { path: '/plan', name: 'Action', element: Action },
  { path: '/plan/ajoutAction', name: 'AjoutAction', element: AjoutAction },
//pneu
 { path: '/pneus/rapportPneu', name: 'RapportPneu', element: RapportPneu},
 { path: '/pneus/consPneu', name: 'ConsPneu', element: ConsPneu},
 
  //avancement DetailP
  { path: '/parc/GestionParc', name: 'GestionParc', element: GestionParc},
  { path: '/projet/affectation/afvoi', name: 'Afvoi', element: Afvoi},
  { path: '/projet', name: 'Rapport', element: Rapport},
  { path: '/projet/affectation', name: 'AfChau', element: AfChau},
  { path: '/projet/ajoutProjet', name: 'AjoutProjet', element: AjoutProjet},
  { path: '/projet/detailP', name: 'DetailP', element: DetailP},
  { path: '/projet/performances', name: '  ProjetPerformances', element: ProjetPerformances},
  { path: '/projet/rapportM', name: 'RapportM', element: RapportM},
  { path: '/projet/aPerformance', name: 'APerformance', element: APerformance},


  //noteDG
  { path: '/noteDG/noteFilee2024', name: 'NoteFile2024', element: NoteFile2024 },
  { path: '/noteDG/noteFile2025', name: 'NoteFile2025', element: NoteFile2025 },
  { path: '/noteFile', name: 'NoteDGF', element: NoteDGF },
  { path: '/home/accueil', name: 'Accueil', element: Accueil},

 


  { path: '/widgets', name: 'Widgets', element: Widgets },
]

export default routes
