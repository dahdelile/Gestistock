export interface User {
  id: number
  name: string
  email: string
  role: "admin" | "magasinier"
  active: boolean
  password?: string;
}
