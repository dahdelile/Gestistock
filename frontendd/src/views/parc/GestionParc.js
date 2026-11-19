import React, { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Button, Form, Spinner, Alert } from "react-bootstrap";

const AjouterParcs = () => {
  const [projects, setProjects] = useState([]);
  const [newProject, setNewProject] = useState({ name: "" });
  const [editingProject, setEditingProject] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (error || successMessage) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, successMessage]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://127.0.0.1:8000/api/parcs/");
      setProjects(response.data);
    } catch (error) {
      setError("Erreur lors du chargement des parcs !");
    } finally {
      setLoading(false);
    }
  };

  const addProject = async () => {
    if (!newProject.name) {
      setError("Le nom du parc est obligatoire !");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("http://127.0.0.1:8000/api/parcs/", {
        name: newProject.name
      });
      setProjects([...projects, response.data]);
      setNewProject({ name: "" });
      setShowAddModal(false);
      setSuccessMessage("Parc ajouté avec succès !");
    } catch (error) {
      setError(error.response?.data?.error || "Erreur lors de l'ajout du parc !");
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (id) => {
    if (window.confirm("Voulez-vous vraiment supprimer ce parc ?")) {
      setLoading(true);
      try {
        await axios.delete(`http://127.0.0.1:8000/api/parcs/${id}/`);
        setProjects(projects.filter((p) => p.id !== id));
        setSuccessMessage("Parc supprimé avec succès !");
      } catch (error) {
        setError("Erreur lors de la suppression du parc !");
      } finally {
        setLoading(false);
      }
    }
  };

  const editProject = (project) => {
    setEditingProject({...project});
    setShowEditModal(true);
  };

  const updateProject = async () => {
    if (!editingProject) return;

    if (!editingProject.name) {
      setError("Le nom du parc est obligatoire !");
      return;
    }

    setLoading(true);
    try {
      await axios.put(`http://127.0.0.1:8000/api/parcs/${editingProject.id}/`, {
        name: editingProject.name
      });
      setProjects(projects.map((p) => (p.id === editingProject.id ? editingProject : p)));
      setShowEditModal(false);
      setSuccessMessage("Parc modifié avec succès !");
    } catch (error) {
      setError(error.response?.data?.error || "Erreur lors de la mise à jour du parc !");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      {error && <Alert variant="danger">{error}</Alert>}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}
      
      <div className="text-center mb-3">
        <Button variant="primary" onClick={() => setShowAddModal(true)} disabled={loading}>
          {loading ? <Spinner animation="border" size="sm" /> : "➕ Ajouter un parc"}
        </Button>
      </div>

      {loading && projects.length === 0 ? (
        <div className="text-center">
          <Spinner animation="border" />
        </div>
      ) : (
        <table className="table table-bordered text-center">
          <thead className="table-dark">
            <tr>
                <th>Nomero de parc</th>
              <th>Nom du Parc</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr key={project.id}>
                <tr>{project.id}</tr>
                <td>{project.name}</td>
                <td>
                  <button className="btn btn-warning btn-sm me-2" onClick={() => editProject(project)} disabled={loading}>
                    Modifier
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteProject(project.id)} disabled={loading}>
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Ajouter un Parc</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nom du parc</Form.Label>
              <Form.Control
                type="text"
                value={newProject.name}
                onChange={(e) => setNewProject({ name: e.target.value })}
                required
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)} disabled={loading}>
            Annuler
          </Button>
          <Button variant="primary" onClick={addProject} disabled={loading}>
            {loading ? <Spinner animation="border" size="sm" /> : "Ajouter"}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Modifier Parc</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editingProject && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Nom du parc</Form.Label>
                <Form.Control
                  type="text"
                  value={editingProject.name}
                  onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                  required
                />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)} disabled={loading}>
            Annuler
          </Button>
          <Button variant="primary" onClick={updateProject} disabled={loading}>
            {loading ? <Spinner animation="border" size="sm" /> : "Modifier"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AjouterParcs;