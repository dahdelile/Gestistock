import { useEffect, useState } from "react";
import axios from "axios";

const Notefile = () => {
    const [produits, setProduits] = useState([]);

    useEffect(() => {
        axios.get("http://127.0.0.1:8000/api/produits/")
            .then(response => {
                setProduits(response.data);
            })
            .catch(error => {
                console.error("Erreur lors de la récupération des produits", error);
            });
    }, []);

    return (
        <div>
            <h1>Liste des Notes</h1>
            <table border="1">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Note</th>
                        <th>Responsable</th>
                        <th>File (€)</th>
                    </tr>
                </thead>
                <tbody>
                    {produits.map(produit => (
                        <tr key={produit.id}>
                            <td>{produit.note}</td>
                            <td>{produit.resp}</td>
                            <td>{produit.file}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default Notefile;
