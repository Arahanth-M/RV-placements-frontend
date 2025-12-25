import React, { useState, useEffect } from "react";
import { useAuth } from "../../utils/AuthContext";
import { commentAPI } from "../../utils/api";
import { FaUser, FaTrash, FaPaperPlane, FaSpinner } from "react-icons/fa";

function CommentsTab({ company }) {
  const { user, isAdmin } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalComments: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const COMMENTS_PER_PAGE = 20;

  useEffect(() => {
    // Reset comments and pagination when company changes
    setComments([]);
    setPagination({
      currentPage: 1,
      totalPages: 1,
      totalComments: 0,
      hasNextPage: false,
      hasPrevPage: false,
    });
    fetchComments(1, true);
  }, [company?._id]);

  const fetchComments = async (page = 1, reset = false) => {
    if (!company?._id) return;
    
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);
    
    try {
      const response = await commentAPI.getComments(company._id, page, COMMENTS_PER_PAGE);
      const { comments: newComments, pagination: paginationData } = response.data;
      
      if (reset) {
        setComments(newComments || []);
      } else {
        // Append new comments to existing ones
        setComments(prev => [...prev, ...(newComments || [])]);
      }
      
      setPagination(paginationData || {
        currentPage: page,
        totalPages: 1,
        totalComments: 0,
        hasNextPage: false,
        hasPrevPage: false,
      });
    } catch (err) {
      console.error("❌ Error fetching comments:", err);
      setError("Failed to load comments. Please try again.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreComments = () => {
    if (pagination.hasNextPage && !loadingMore) {
      fetchComments(pagination.currentPage + 1, false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert("Please log in to post a comment.");
      return;
    }

    if (!newComment.trim()) {
      alert("Please enter a comment.");
      return;
    }

    if (newComment.trim().length > 2000) {
      alert("Comment cannot exceed 2000 characters.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await commentAPI.createComment(company._id, newComment.trim());
      // Add new comment to the beginning and update total count
      setComments([response.data, ...comments]);
      setPagination(prev => ({
        ...prev,
        totalComments: prev.totalComments + 1,
      }));
      setNewComment("");
    } catch (err) {
      console.error("❌ Error creating comment:", err);
      setError(
        err.response?.data?.error || 
        "Failed to post comment. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) {
      return;
    }

    try {
      await commentAPI.deleteComment(commentId);
      setComments(comments.filter(comment => comment._id !== commentId));
      // Update total count
      setPagination(prev => ({
        ...prev,
        totalComments: Math.max(0, prev.totalComments - 1),
      }));
    } catch (err) {
      console.error("❌ Error deleting comment:", err);
      alert(
        err.response?.data?.error || 
        "Failed to delete comment. Please try again."
      );
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return "just now";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? "s" : ""} ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-center py-12">
            <FaSpinner className="animate-spin text-4xl text-indigo-400" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-slate-200">
      <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4 sm:mb-6 text-indigo-400">
          Comments & Discussions
        </h2>

        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 sm:p-4 mb-4">
            <p className="text-red-300 text-sm sm:text-base">{error}</p>
          </div>
        )}

        {/* Comment Form */}
        {user ? (
          <form onSubmit={handleSubmit} className="mb-6 sm:mb-8">
            <div className="mb-3 sm:mb-4">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts about this company - work culture, experience, questions, or clarifications..."
                className="w-full border border-slate-600 rounded-lg px-3 sm:px-4 py-2 sm:py-3 bg-slate-900 text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-vertical min-h-[100px] text-sm sm:text-base"
                maxLength={2000}
                disabled={submitting}
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs sm:text-sm text-slate-400">
                  {newComment.length}/2000 characters
                </p>
                <button
                  type="submit"
                  disabled={submitting || !newComment.trim()}
                  className="px-4 sm:px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition duration-200 flex items-center gap-2 text-sm sm:text-base"
                >
                  {submitting ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <FaPaperPlane />
                      Post Comment
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="bg-indigo-900/30 border border-indigo-700 rounded-lg p-4 mb-6 sm:mb-8">
            <p className="text-indigo-300 text-sm sm:text-base">
              Please <a href="/auth/callback" className="underline font-semibold">log in</a> to post a comment.
            </p>
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-4">
          {comments.length === 0 && !loading ? (
            <div className="text-center py-8 sm:py-12">
              <FaUser className="mx-auto text-slate-500 text-4xl sm:text-5xl mb-3 sm:mb-4" />
              <p className="text-slate-400 text-sm sm:text-base">
                No comments yet. Be the first to share your thoughts!
              </p>
            </div>
          ) : (
            <>
              {pagination.totalComments > 0 && (
                <div className="text-sm text-slate-400 mb-4">
                  Showing {comments.length} of {pagination.totalComments} comment{pagination.totalComments !== 1 ? 's' : ''}
                </div>
              )}
              {comments.map((comment) => {
                const isOwner = user && comment.user?._id === user._id;
                const canDelete = isOwner || isAdmin;
                
                return (
                  <div
                    key={comment._id}
                    className="border border-slate-700 rounded-lg p-4 sm:p-5 bg-slate-800/60 hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2 sm:mb-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-xs sm:text-sm">
                          {comment.user?.picture ? (
                            <img
                              src={comment.user.picture}
                              alt={comment.username}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <FaUser />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-200 text-sm sm:text-base">
                            {comment.username || comment.user?.username || "Anonymous"}
                          </p>
                          <p className="text-xs sm:text-sm text-slate-400">
                            {formatDate(comment.createdAt)}
                          </p>
                        </div>
                      </div>
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(comment._id)}
                          className="text-red-400 hover:text-red-300 p-1 sm:p-2 hover:bg-red-900/30 rounded transition duration-200"
                          title={isAdmin && !isOwner ? "Delete comment (Admin)" : "Delete comment"}
                        >
                          <FaTrash className="text-sm sm:text-base" />
                        </button>
                      )}
                    </div>
                    <p className="text-slate-300 text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words">
                      {comment.comment}
                    </p>
                  </div>
                );
              })}
              
              {/* Load More Button */}
              {pagination.hasNextPage && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={loadMoreComments}
                    disabled={loadingMore}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition duration-200 flex items-center gap-2"
                  >
                    {loadingMore ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        Loading...
                      </>
                    ) : (
                      "Load More Comments"
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default CommentsTab;

