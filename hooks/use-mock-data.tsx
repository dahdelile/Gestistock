"use client"

import type React from "react"

import type { Product } from "@/types/product"
import type { StockMovement, StockMovementInput } from "@/types/stock-movement"
import type { Supplier } from "@/types/supplier"
import type { User } from "@/types/user"
import type { EntryForm } from "@/types/entry-form"
import type { ExitForm } from "@/types/exit-form"
import { createContext, useContext, useEffect, useState } from "react"
import { v4 as uuidv4 } from "uuid"
import { useAuth } from "./use-auth"

// Empty initial data structures
const initialProducts: Product[] = [
  {
    id: "p1",
    reference: "ECR-001",
    name: "Écran 24 pouces",
    description: "Écran LCD Full HD 24 pouces",
    category: "Électronique",
    price: 149.99,
    quantity: 15,
    minStock: 5,
  },
  {
    id: "p2",
    reference: "CLA-001",
    name: "Clavier sans fil",
    description: "Clavier sans fil avec pavé numérique",
    category: "Électronique",
    price: 39.99,
    quantity: 25,
    minStock: 10,
  },
  {
    id: "p3",
    reference: "SOU-001",
    name: "Souris optique",
    description: "Souris optique sans fil",
    category: "Électronique",
    price: 19.99,
    quantity: 30,
    minStock: 15,
  },
  {
    id: "p4",
    reference: "BUR-001",
    name: "Bureau standard",
    description: "Bureau de travail 120x80cm",
    category: "Mobilier",
    price: 199.99,
    quantity: 8,
    minStock: 3,
  },
  {
    id: "p5",
    reference: "CHA-001",
    name: "Chaise de bureau",
    description: "Chaise ergonomique pour bureau",
    category: "Mobilier",
    price: 129.99,
    quantity: 12,
    minStock: 5,
  },
  {
    id: "p6",
    reference: "ARM-001",
    name: "Armoire de rangement",
    description: "Armoire de rangement 2 portes",
    category: "Mobilier",
    price: 249.99,
    quantity: 4,
    minStock: 2,
  },
  {
    id: "p7",
    reference: "PAP-001",
    name: "Papier A4",
    description: "Ramette de papier A4 500 feuilles",
    category: "Fournitures",
    price: 5.99,
    quantity: 50,
    minStock: 20,
  },
  {
    id: "p8",
    reference: "STY-001",
    name: "Stylos bleus",
    description: "Lot de 10 stylos à bille bleus",
    category: "Fournitures",
    price: 8.99,
    quantity: 40,
    minStock: 15,
  },
  {
    id: "p9",
    reference: "AGR-001",
    name: "Agrafeuse",
    description: "Agrafeuse de bureau standard",
    category: "Fournitures",
    price: 12.99,
    quantity: 18,
    minStock: 8,
  },
  {
    id: "p10",
    reference: "IMP-001",
    name: "Imprimante laser",
    description: "Imprimante laser noir et blanc",
    category: "Électronique",
    price: 299.99,
    quantity: 3,
    minStock: 2,
  },
  {
    id: "p11",
    reference: "TON-001",
    name: "Toner noir",
    description: "Cartouche de toner pour imprimante laser",
    category: "Fournitures",
    price: 49.99,
    quantity: 10,
    minStock: 5,
  },
  {
    id: "p12",
    reference: "CLA-002",
    name: "Classeurs",
    description: "Lot de 5 classeurs A4",
    category: "Fournitures",
    price: 15.99,
    quantity: 25,
    minStock: 10,
  },
]

const initialCategories = ["Électronique", "Mobilier", "Fournitures"]

const initialStockMovements: StockMovement[] = [
  {
    id: "m1",
    productId: "p1",
    type: "entry",
    quantity: 5,
    date: new Date().toISOString(),
    reason: "Réapprovisionnement",
  },
  {
    id: "m2",
    productId: "p2",
    type: "entry",
    quantity: 10,
    date: new Date().toISOString(),
    reason: "Réapprovisionnement",
  },
  {
    id: "m3",
    productId: "p3",
    type: "exit",
    quantity: 2,
    date: new Date().toISOString(),
    reason: "Vente",
  },
  {
    id: "m4",
    productId: "p4",
    type: "exit",
    quantity: 1,
    date: new Date().toISOString(),
    reason: "Utilisation interne",
  },
  {
    id: "m5",
    productId: "p5",
    type: "entry",
    quantity: 3,
    date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    reason: "Réapprovisionnement",
  },
  {
    id: "m6",
    productId: "p6",
    type: "exit",
    quantity: 1,
    date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    reason: "Vente",
  },
  {
    id: "m7",
    productId: "p7",
    type: "entry",
    quantity: 15,
    date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    reason: "Réapprovisionnement",
  },
  {
    id: "m8",
    productId: "p8",
    type: "exit",
    quantity: 5,
    date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    reason: "Utilisation interne",
  },
]

const initialSuppliers: Supplier[] = [
  {
    id: "s1",
    name: "TechSupply",
    email: "contact@techsupply.com",
    phone: "+33 1 23 45 67 89",
    address: "123 Rue de la Technologie, 75001 Paris",
    notes: "Fournisseur principal d'équipements électroniques",
  },
  {
    id: "s2",
    name: "MobilierPro",
    email: "info@mobilierpro.com",
    phone: "+33 1 98 76 54 32",
    address: "456 Avenue du Mobilier, 69002 Lyon",
    notes: "Spécialiste du mobilier de bureau",
  },
  {
    id: "s3",
    name: "FourniPlus",
    email: "commandes@fourniplus.com",
    phone: "+33 5 55 55 55 55",
    address: "789 Boulevard des Fournitures, 33000 Bordeaux",
    notes: "Fournitures de bureau et papeterie",
  },
]

const initialUsers: User[] = [
  {
    id: "u1",
    name: "Admin User",
    email: "admin@gestistock.com",
    role: "admin",
    active: true,
  },
  {
    id: "u2",
    name: "Magasinier User",
    email: "magasinier@gestistock.com",
    role: "magasinier",
    active: true,
  },
  {
    id: "u3",
    name: "Jean Dupont",
    email: "jean.dupont@gestistock.com",
    role: "magasinier",
    active: true,
  },
  {
    id: "u4",
    name: "Marie Martin",
    email: "marie.martin@gestistock.com",
    role: "admin",
    active: false,
  },
]

const initialEntryForms: EntryForm[] = [
  {
    id: "e1",
    reference: "BE-2023-0001",
    date: new Date().toISOString(),
    supplierId: "s1",
    supplierName: "TechSupply",
    notes: "Livraison standard",
    status: "completed",
    items: [
      {
        id: "ei1",
        productId: "p1",
        productName: "Écran 24 pouces",
        quantity: 5,
        unitPrice: 149.99,
        total: 749.95,
      },
      {
        id: "ei2",
        productId: "p2",
        productName: "Clavier sans fil",
        quantity: 10,
        unitPrice: 39.99,
        total: 399.9,
      },
    ],
    total: 1149.85,
  },
  {
    id: "e2",
    reference: "BE-2023-0002",
    date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    supplierId: "s2",
    supplierName: "MobilierPro",
    notes: "Commande urgente",
    status: "completed",
    items: [
      {
        id: "ei3",
        productId: "p4",
        productName: "Bureau standard",
        quantity: 3,
        unitPrice: 199.99,
        total: 599.97,
      },
      {
        id: "ei4",
        productId: "p5",
        productName: "Chaise de bureau",
        quantity: 5,
        unitPrice: 129.99,
        total: 649.95,
      },
    ],
    total: 1249.92,
  },
]

const initialExitForms: ExitForm[] = [
  {
    id: "x1",
    reference: "BS-2023-0001",
    date: new Date().toISOString(),
    destination: "Service Informatique",
    reason: "Équipement des nouveaux postes",
    notes: "Livraison au 3ème étage",
    status: "completed",
    items: [
      {
        id: "xi1",
        productId: "p1",
        productName: "Écran 24 pouces",
        quantity: 2,
      },
      {
        id: "xi2",
        productId: "p2",
        productName: "Clavier sans fil",
        quantity: 2,
      },
      {
        id: "xi3",
        productId: "p3",
        productName: "Souris optique",
        quantity: 2,
      },
    ],
  },
  {
    id: "x2",
    reference: "BS-2023-0002",
    date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    destination: "Service Marketing",
    reason: "Réaménagement des bureaux",
    notes: "",
    status: "completed",
    items: [
      {
        id: "xi4",
        productId: "p4",
        productName: "Bureau standard",
        quantity: 1,
      },
      {
        id: "xi5",
        productId: "p5",
        productName: "Chaise de bureau",
        quantity: 2,
      },
    ],
  },
]

interface MockDataContextType {
  products: Product[]
  categories: string[]
  stockMovements: StockMovement[]
  suppliers: Supplier[]
  users: User[]
  entryForms: EntryForm[]
  exitForms: ExitForm[]
  addProduct: (product: Product) => void
  updateProduct: (product: Product) => void
  deleteProduct: (productId: string) => void
  addStockMovement: (movement: StockMovementInput) => void
  addSupplier: (supplier: Supplier) => void
  updateSupplier: (supplier: Supplier) => void
  deleteSupplier: (supplierId: string) => void
  addUser: (user: User) => void
  updateUser: (user: User) => void
  deleteUser: (userId: string) => void
  addEntryForm: (entryForm: EntryForm) => void
  deleteEntryForm: (entryFormId: string) => void
  addExitForm: (exitForm: ExitForm) => void
  deleteExitForm: (exitFormId: string) => void
  addCategory: (category: string) => void
  updateCategory: (oldCategory: string, newCategory: string) => void
  deleteCategory: (category: string) => void
}

const MockDataContext = createContext<MockDataContextType>({
  products: [],
  categories: [],
  stockMovements: [],
  suppliers: [],
  users: [],
  entryForms: [],
  exitForms: [],
  addProduct: () => {},
  updateProduct: () => {},
  deleteProduct: () => {},
  addStockMovement: () => {},
  addSupplier: () => {},
  updateSupplier: () => {},
  deleteSupplier: () => {},
  addUser: () => {},
  updateUser: () => {},
  deleteUser: () => {},
  addEntryForm: () => {},
  deleteEntryForm: () => {},
  addExitForm: () => {},
  deleteExitForm: () => {},
  addCategory: () => {},
  updateCategory: () => {},
  deleteCategory: () => {},
})

export function MockDataProvider({ children }: { children: React.ReactNode }) {
  // Load data from localStorage or use initial data
  const [products, setProducts] = useState<Product[]>(() => {
    const storedProducts = localStorage.getItem("products")
    return storedProducts ? JSON.parse(storedProducts) : initialProducts
  })

  const [categories, setCategories] = useState<string[]>(() => {
    const storedCategories = localStorage.getItem("categories")
    return storedCategories ? JSON.parse(storedCategories) : initialCategories
  })

  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => {
    const storedMovements = localStorage.getItem("stockMovements")
    return storedMovements ? JSON.parse(storedMovements) : initialStockMovements
  })

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const storedSuppliers = localStorage.getItem("suppliers")
    return storedSuppliers ? JSON.parse(storedSuppliers) : initialSuppliers
  })

  const [users, setUsers] = useState<User[]>(() => {
    const storedUsers = localStorage.getItem("users")
    return storedUsers ? JSON.parse(storedUsers) : initialUsers
  })

  const [entryForms, setEntryForms] = useState<EntryForm[]>(() => {
    const storedEntryForms = localStorage.getItem("entryForms")
    return storedEntryForms ? JSON.parse(storedEntryForms) : initialEntryForms
  })

  const [exitForms, setExitForms] = useState<ExitForm[]>(() => {
    const storedExitForms = localStorage.getItem("exitForms")
    return storedExitForms ? JSON.parse(storedExitForms) : initialExitForms
  })

  // Save data to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("products", JSON.stringify(products))
  }, [products])

  useEffect(() => {
    localStorage.setItem("categories", JSON.stringify(categories))
  }, [categories])

  useEffect(() => {
    localStorage.setItem("stockMovements", JSON.stringify(stockMovements))
  }, [stockMovements])

  useEffect(() => {
    localStorage.setItem("suppliers", JSON.stringify(suppliers))
  }, [suppliers])

  useEffect(() => {
    localStorage.setItem("users", JSON.stringify(users))
  }, [users])

  useEffect(() => {
    localStorage.setItem("entryForms", JSON.stringify(entryForms))
  }, [entryForms])

  useEffect(() => {
    localStorage.setItem("exitForms", JSON.stringify(exitForms))
  }, [exitForms])

  // Product operations
  const addProduct = (product: Product) => {
    setProducts((prev) => [...prev, product])

    // Add category if it doesn't exist
    if (!categories.includes(product.category)) {
      setCategories((prev) => [...prev, product.category])
    }
  }

  const updateProduct = (product: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === product.id ? product : p)))

    // Add category if it doesn't exist
    if (!categories.includes(product.category)) {
      setCategories((prev) => [...prev, product.category])
    }
  }

  const deleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId))
  }

  // Stock movement operations
  const addStockMovement = (movement: StockMovementInput) => {
    const newMovement: StockMovement = {
      id: uuidv4(),
      productId: movement.productId,
      type: movement.type,
      quantity: movement.quantity,
      date: new Date().toISOString(),
      reason: movement.reason,
    }

    setStockMovements((prev) => [...prev, newMovement])

    // Update product quantity
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === movement.productId) {
          const newQuantity =
            movement.type === "entry" ? p.quantity + movement.quantity : p.quantity - movement.quantity
          return { ...p, quantity: newQuantity }
        }
        return p
      }),
    )
  }

  // Supplier operations
  const addSupplier = (supplier: Supplier) => {
    setSuppliers((prev) => [...prev, supplier])
  }

  const updateSupplier = (supplier: Supplier) => {
    setSuppliers((prev) => prev.map((s) => (s.id === supplier.id ? supplier : s)))
  }

  const deleteSupplier = (supplierId: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== supplierId))
  }

  // User operations
  const addUser = (user: User) => {
    setUsers((prev) => [...prev, user])
  }

  const updateUser = (user: User) => {
    setUsers((prev) => prev.map((u) => (u.id === user.id ? user : u)))
  }

  const deleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId))
  }

  // Entry form operations
  const addEntryForm = (entryForm: EntryForm) => {
    setEntryForms((prev) => [...prev, entryForm])

    // Update product quantities
    entryForm.items.forEach((item) => {
      addStockMovement({
        productId: item.productId,
        type: "entry",
        quantity: item.quantity,
        reason: `Bon d'entrée ${entryForm.reference}`,
      })
    })
  }

  const deleteEntryForm = (entryFormId: string) => {
    setEntryForms((prev) => prev.filter((e) => e.id !== entryFormId))
  }

  // Exit form operations
  const addExitForm = (exitForm: ExitForm) => {
    setExitForms((prev) => [...prev, exitForm])

    // Update product quantities
    exitForm.items.forEach((item) => {
      addStockMovement({
        productId: item.productId,
        type: "exit",
        quantity: item.quantity,
        reason: `Bon de sortie ${exitForm.reference}`,
      })
    })
  }

  const deleteExitForm = (exitFormId: string) => {
    setExitForms((prev) => prev.filter((e) => e.id !== exitFormId))
  }

  // Category operations
  const addCategory = (category: string) => {
    if (!categories.includes(category)) {
      setCategories((prev) => [...prev, category])
    }
  }

  const updateCategory = (oldCategory: string, newCategory: string) => {
    if (oldCategory === newCategory) return

    setCategories((prev) => {
      const newCategories = prev.map((cat) => (cat === oldCategory ? newCategory : cat))
      return newCategories
    })

    // Update products with this category
    setProducts((prev) => {
      return prev.map((product) => {
        if (product.category === oldCategory) {
          return { ...product, category: newCategory }
        }
        return product
      })
    })
  }

  const deleteCategory = (category: string) => {
    setCategories((prev) => prev.filter((cat) => cat !== category))

    // Update products with this category to "Non catégorisé"
    setProducts((prev) => {
      return prev.map((product) => {
        if (product.category === category) {
          return { ...product, category: "Non catégorisé" }
        }
        return product
      })
    })
  }

  return (
    <MockDataContext.Provider
      value={{
        products,
        categories,
        stockMovements,
        suppliers,
        users,
        entryForms,
        exitForms,
        addProduct,
        updateProduct,
        deleteProduct,
        addStockMovement,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        addUser,
        updateUser,
        deleteUser,
        addEntryForm,
        deleteEntryForm,
        addExitForm,
        deleteExitForm,
        addCategory,
        updateCategory,
        deleteCategory,
      }}
    >
      {children}
    </MockDataContext.Provider>
  )
}

export const useMockData = () => useContext(MockDataContext)
