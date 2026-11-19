import React, { useState } from "react";
import { Table, Button, Form } from "react-bootstrap";

const PlanAction = () => {
  const [actions, setActions] = useState([]);
  const [newAction, setNewAction] = useState({ name: "", status: "En attente", dueDate: "", owner: "" });
  const [showForm, setShowForm] = useState(false);

  const addAction = () => {
    setActions([...actions, { ...newAction, id: Date.now() }]);
    setNewAction({ name: "", status: "En attente", dueDate: "", owner: "" });
    setShowForm(false);
  };

  const deleteAction = (id) => {
    setActions(actions.filter((action) => action.id !== id));
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4 fw-bold text-center" style={{ color: "#333" }}>
        Plan d'Action</h2>

      <Button variant="primary" onClick={() => setShowForm(!showForm)} className="mb-3">
        {showForm ? "Masquer le formulaire" : "Ajouter une Action"}
      </Button>

      {showForm && (
        <div className="mb-4 p-3 border rounded">
          <Form>
            <Form.Group className="mb-2">
              <Form.Label>Nom de l'Action</Form.Label>
              <Form.Control
                type="text"
                value={newAction.name}
                onChange={(e) => setNewAction({ ...newAction, name: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Statut</Form.Label>
              <Form.Select
                value={newAction.status}
                onChange={(e) => setNewAction({ ...newAction, status: e.target.value })}
              >
                <option>En attente</option>
                <option>En cours</option>
                <option>Terminé</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Date d'échéance</Form.Label>
              <Form.Control
                type="date"
                value={newAction.dueDate}
                onChange={(e) => setNewAction({ ...newAction, dueDate: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Responsable</Form.Label>
              <Form.Control
                type="text"
                value={newAction.owner}
                onChange={(e) => setNewAction({ ...newAction, owner: e.target.value })}
              />
            </Form.Group>
            <Button variant="success" className="mt-2" onClick={addAction}>
              Ajouter
            </Button>
          </Form>
        </div>
      )}

      <Table bordered hover>
        <thead className="table-dark">
          <tr>
            <th>Nom</th>
            <th>Statut</th>
            <th>Échéance</th>
            <th>Responsable</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {actions.length > 0 ? (
            actions.map((action) => (
              <tr key={action.id}>
                <td>{action.name}</td>
                <td>{action.status}</td>
                <td>{action.dueDate}</td>
                <td>{action.owner}</td>
                <td>
                  <Button variant="danger" size="sm" onClick={() => deleteAction(action.id)}>
                    Supprimer
                  </Button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="text-center">Aucune action définie</td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
};

export default PlanAction;
