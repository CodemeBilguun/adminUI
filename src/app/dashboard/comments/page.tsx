// src/app/dashboard/comments/page.tsx
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
  Typography,
  IconButton,
  Chip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import api from "@/services/api";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    name: string;
    id: string;
  };
  articleId: string;
}

interface Article {
  id: string;
  title: string;
}

export default function Comments() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [viewComment, setViewComment] = useState<Comment | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(
    null
  );

  useEffect(() => {
    fetchArticlesAndComments();
  }, []);

  const fetchArticlesAndComments = async () => {
    try {
      setLoading(true);

      // First get articles
      const articlesRes = await api.get("/articles");
      const articles = articlesRes.data.articles || [];
      setArticles(articles);

      // Then get comments for each article (or at least the first few)
      const allComments: Comment[] = [];

      // Limit to first 5 articles for performance
      const articlesToFetch = articles.slice(0, 5);

      for (const article of articlesToFetch) {
        try {
          const commentsRes = await api.get(`/comments/article/${article.id}`);
          if (Array.isArray(commentsRes.data)) {
            // Add article title information
            const commentsWithArticle = commentsRes.data.map(
              (comment: any) => ({
                ...comment,
                articleTitle: article.title,
              })
            );
            allComments.push(...commentsWithArticle);
          }
        } catch (err) {
          console.warn(
            `Error fetching comments for article ${article.id}:`,
            err
          );
        }
      }

      setComments(allComments);
    } catch (err) {
      console.error("Error fetching comments:", err);
      setError("Failed to load comments");
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

  const handleViewComment = (comment: Comment) => {
    setViewComment(comment);
  };

  const handleDeleteClick = (commentId: string) => {
    setSelectedCommentId(commentId);
    setConfirmDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCommentId) return;

    try {
      await api.delete(`/comments/${selectedCommentId}`);
      fetchArticlesAndComments(); // Refresh data
      setConfirmDeleteOpen(false);
    } catch (err) {
      console.error("Error deleting comment:", err);
    }
  };

  const getArticleTitle = (articleId: string) => {
    const article = articles.find((a) => a.id === articleId);
    return article?.title || "Unknown Article";
  };

  if (loading) return <Typography>Loading comments...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Comment Management
      </Typography>

      <Paper sx={{ width: "100%", mb: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Content</TableCell>
                <TableCell>Article</TableCell>
                <TableCell>Author</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {comments
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((comment) => (
                  <TableRow key={comment.id}>
                    <TableCell>
                      {comment.content.length > 50
                        ? `${comment.content.substring(0, 50)}...`
                        : comment.content}
                    </TableCell>
                    <TableCell>{getArticleTitle(comment.articleId)}</TableCell>
                    <TableCell>{comment.user?.name}</TableCell>
                    <TableCell>
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleViewComment(comment)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteClick(comment.id)}
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
          count={comments.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* View Comment Dialog */}
      <Dialog
        open={!!viewComment}
        onClose={() => setViewComment(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Comment Details</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2">
            On article:{" "}
            {viewComment ? getArticleTitle(viewComment.articleId) : ""}
          </Typography>
          <Typography variant="caption" display="block" gutterBottom>
            By: {viewComment?.user?.name} |
            {viewComment
              ? new Date(viewComment.createdAt).toLocaleDateString()
              : ""}
          </Typography>
          <Box
            sx={{ mt: 2, p: 2, bgcolor: "background.paper", borderRadius: 1 }}
          >
            <Typography variant="body1">{viewComment?.content}</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewComment(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this comment?</Typography>
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
