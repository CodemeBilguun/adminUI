// src/app/dashboard/articles/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  IconButton,
  Chip,
  FormControlLabel,
  Switch,
  Stack,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import api from "@/services/api";

interface Article {
  id: string;
  title: string;
  content: string;
  isPublished: boolean;
  createdAt: string;
  author: {
    name: string;
    id: string;
  };
  tags?: string[];
}

// Form state for article editing
interface ArticleFormData {
  title: string;
  content: string;
  isPublished: boolean;
  tags: string;
}

export default function Articles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [viewArticle, setViewArticle] = useState<Article | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(
    null
  );

  // New state variables for edit functionality
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editArticle, setEditArticle] = useState<Article | null>(null);
  const [formData, setFormData] = useState<ArticleFormData>({
    title: "",
    content: "",
    isPublished: false,
    tags: "",
  });
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const response = await api.get("/articles");

      // Handle different API response structures
      if (response.data && Array.isArray(response.data)) {
        // Direct array response
        setArticles(response.data);
      } else if (response.data && Array.isArray(response.data.articles)) {
        // Response with nested "articles" property
        setArticles(response.data.articles);
      } else if (
        response.data &&
        response.data.data &&
        Array.isArray(response.data.data)
      ) {
        // Response with nested "data" property (common in paginated APIs)
        setArticles(response.data.data);
      } else {
        // Fallback - empty array if we can't find articles
        console.error("Unexpected API response format:", response.data);
        setArticles([]);
        setError("Unexpected data format from API");
      }
    } catch (err) {
      console.error("Error fetching articles:", err);
      setError("Failed to load articles");
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewArticle = (article: Article) => {
    setViewArticle(article);
  };

  const handleDeleteClick = (articleId: string) => {
    setSelectedArticleId(articleId);
    setConfirmDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedArticleId) return;

    try {
      await api.delete(`/articles/${selectedArticleId}`);
      fetchArticles();
      setConfirmDeleteOpen(false);
    } catch (err) {
      console.error("Error deleting article:", err);
    }
  };

  // New handlers for edit functionality
  const handleEditClick = (article: Article) => {
    setEditArticle(article);
    setFormData({
      title: article.title,
      content: article.content,
      isPublished: article.isPublished,
      tags: article.tags ? article.tags.join(", ") : "",
    });
    setEditDialogOpen(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    setFormData({
      ...formData,
      [name]: name === "isPublished" ? checked : value,
    });
  };

  const handleSaveArticle = async () => {
    if (!editArticle) return;

    // Basic validation
    if (!formData.title.trim() || !formData.content.trim()) {
      setFormError("Title and content are required");
      return;
    }

    try {
      setIsSaving(true);
      setFormError("");

      // Process tags from comma-separated string to array
      const tags = formData.tags
        ? formData.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        : [];

      await api.put(`/articles/${editArticle.id}`, {
        title: formData.title,
        content: formData.content,
        isPublished: formData.isPublished,
        tags: tags,
      });

      // Refresh articles list
      await fetchArticles();
      setEditDialogOpen(false);
    } catch (err) {
      console.error("Error saving article:", err);
      setFormError("Failed to save article. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <Typography>Loading articles...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Article Management
      </Typography>

      <Paper sx={{ width: "100%", mb: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Author</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {articles
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((article) => (
                  <TableRow key={article.id}>
                    <TableCell>{article.title}</TableCell>
                    <TableCell>{article.author?.name}</TableCell>
                    <TableCell>
                      <Chip
                        label={article.isPublished ? "Published" : "Draft"}
                        color={article.isPublished ? "success" : "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(article.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleViewArticle(article)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleEditClick(article)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteClick(article.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={articles.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* View Article Dialog */}
      <Dialog
        open={!!viewArticle}
        onClose={() => setViewArticle(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{viewArticle?.title}</DialogTitle>
        <DialogContent>
          <Typography variant="caption" display="block" gutterBottom>
            Author: {viewArticle?.author?.name} |
            {new Date(viewArticle?.createdAt || "").toLocaleDateString()}
          </Typography>
          <Box sx={{ mt: 2, whiteSpace: "pre-wrap" }}>
            {viewArticle?.content}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewArticle(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Article Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => !isSaving && setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Article</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {formError && (
              <Typography color="error" variant="body2">
                {formError}
              </Typography>
            )}

            <TextField
              fullWidth
              label="Title"
              name="title"
              value={formData.title}
              onChange={handleFormChange}
              variant="outlined"
              disabled={isSaving}
              required
            />

            <TextField
              fullWidth
              label="Content"
              name="content"
              value={formData.content}
              onChange={handleFormChange}
              variant="outlined"
              multiline
              rows={10}
              disabled={isSaving}
              required
            />

            <TextField
              fullWidth
              label="Tags (comma separated)"
              name="tags"
              value={formData.tags}
              onChange={handleFormChange}
              variant="outlined"
              disabled={isSaving}
              placeholder="tech, news, programming"
              helperText="Enter tags separated by commas"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.isPublished}
                  onChange={handleFormChange}
                  name="isPublished"
                  color="primary"
                  disabled={isSaving}
                />
              }
              label={`Status: ${formData.isPublished ? "Published" : "Draft"}`}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveArticle}
            color="primary"
            disabled={isSaving}
            variant="contained"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this article?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
