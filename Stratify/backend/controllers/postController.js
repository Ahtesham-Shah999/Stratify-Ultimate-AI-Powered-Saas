const Post = require('../models/post');
const mongoose = require('mongoose');

// Helper: format a post document for the feed (add net_score)
function formatPost(p) {
  const obj = p.toObject ? p.toObject() : p;
  obj.net_score = (obj.upvotes || 0) - (obj.downvotes || 0);
  return obj;
}

exports.createPost = async (req, res) => {
  try {
    const {
      user_id, strategy_id, title, body,
      is_featured, strategy_name, backtest_metrics
    } = req.body;

    if (!user_id || !title || !body) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const post = new Post({
      user_id,
      strategy_id: strategy_id || null,
      title,
      body,
      is_featured: is_featured || false,
      strategy_name: strategy_name || "",
      backtest_metrics: backtest_metrics || {}
    });
    await post.save();

    // Return populated
    const populated = await Post.findById(post._id)
      .populate('user_id', 'username profile_pic');

    res.status(201).json({ message: "Post created successfully", post: formatPost(populated) });

  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('user_id', 'username profile_pic')
      .sort({ published_at: -1 });

    if (!posts.length) {
      return res.status(404).json({ message: "No posts found" });
    }

    res.status(200).json(posts.map(formatPost));

  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getPostById = async (req, res) => {
  try {
    const { post_id } = req.params;

    const post = await Post.findById(post_id)
      .populate('user_id', 'username profile_pic');

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json(formatPost(post));

  } catch (error) {
    console.error("Error fetching post:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getPostsByUser = async (req, res) => {
  try {
    const { user_id } = req.params;

    const posts = await Post.find({ user_id })
      .populate('user_id', 'username profile_pic')
      .sort({ published_at: -1 });

    if (!posts.length) {
      return res.status(404).json({ message: "No posts found for this user" });
    }

    res.status(200).json(posts.map(formatPost));

  } catch (error) {
    console.error("Error fetching user posts:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getPostsByStrategy = async (req, res) => {
  try {
    const { strategy_id } = req.params;

    const posts = await Post.find({ strategy_id })
      .populate('user_id', 'username profile_pic')
      .sort({ published_at: -1 });

    if (!posts.length) {
      return res.status(404).json({ message: "No posts found for this strategy" });
    }

    res.status(200).json(posts.map(formatPost));

  } catch (error) {
    console.error("Error fetching strategy posts:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getFeaturedPosts = async (req, res) => {
  try {
    const posts = await Post.find({ is_featured: true })
      .populate('user_id', 'username profile_pic')
      .sort({ published_at: -1 });

    if (!posts.length) {
      return res.status(404).json({ message: "No featured posts found" });
    }

    res.status(200).json(posts.map(formatPost));

  } catch (error) {
    console.error("Error fetching featured posts:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const { post_id } = req.params;
    const updates = req.body;

    const post = await Post.findByIdAndUpdate(post_id, updates, {
      new: true,
      runValidators: true
    }).populate('user_id', 'username profile_pic');

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json({ message: "Post updated successfully", post: formatPost(post) });

  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const { post_id } = req.params;

    const post = await Post.findByIdAndDelete(post_id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json({ message: "Post deleted successfully" });

  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ── Reddit-style upvote / downvote ────────────────────────────────────────────
// Body: { user_id, vote } — vote = "up" | "down"
exports.votePost = async (req, res) => {
  try {
    const { post_id } = req.params;
    const { user_id, vote } = req.body;

    if (!user_id || !['up', 'down'].includes(vote)) {
      return res.status(400).json({ error: "user_id and vote ('up'|'down') are required." });
    }

    const userId = new mongoose.Types.ObjectId(user_id);
    const post = await Post.findById(post_id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const alreadyUp   = post.upvoted_by.some(id => id.equals(userId));
    const alreadyDown = post.downvoted_by.some(id => id.equals(userId));

    if (vote === 'up') {
      if (alreadyUp) {
        // Toggle off
        post.upvoted_by.pull(userId);
        post.upvotes = Math.max(0, post.upvotes - 1);
      } else {
        // Remove any existing downvote first
        if (alreadyDown) {
          post.downvoted_by.pull(userId);
          post.downvotes = Math.max(0, post.downvotes - 1);
        }
        post.upvoted_by.push(userId);
        post.upvotes += 1;
      }
    } else {
      if (alreadyDown) {
        // Toggle off
        post.downvoted_by.pull(userId);
        post.downvotes = Math.max(0, post.downvotes - 1);
      } else {
        // Remove any existing upvote first
        if (alreadyUp) {
          post.upvoted_by.pull(userId);
          post.upvotes = Math.max(0, post.upvotes - 1);
        }
        post.downvoted_by.push(userId);
        post.downvotes += 1;
      }
    }

    await post.save();

    res.status(200).json({
      upvotes:   post.upvotes,
      downvotes: post.downvotes,
      net_score: post.upvotes - post.downvotes
    });

  } catch (error) {
    console.error("Error voting on post:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};