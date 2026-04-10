import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

const AddReview = () => {
  const { companyId } = useParams();

  const [rating, setRating] = useState('');
  const [review, setReview] = useState('');
  const [debugData, setDebugData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const user = auth.currentUser;

      if (!user) {
        alert("Login required ❌");
        return;
      }

      await addDoc(collection(db, "reviews"), {
        companyId: companyId,
        rating: Number(rating),
        title : review,
        description:review,
        userId: user.uid, // ✅ VERY IMPORTANT
        reviews: userReviews,
        userName: user.displayName || "Anonymous",
        createdAt: serverTimestamp(),
      });

      alert("Review Submitted ✅");

      setRating('');
      setReview('');

    } catch (error) {
      console.error(error);
      alert("Error submitting review ❌");
    }
  };

  return (
    <div className="page-container py-10">
      <h1 className="text-2xl font-bold text-white mb-6">
        Write Review
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* ⭐ RATING */}
        <div>
          <label className="text-white block mb-1">Rating</label>
          <select
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            className="w-full p-2 rounded bg-slate-800 text-white"
            required
          >
            <option value="">Select Rating</option>
            <option value="1">⭐ 1</option>
            <option value="2">⭐⭐ 2</option>
            <option value="3">⭐⭐⭐ 3</option>
            <option value="4">⭐⭐⭐⭐ 4</option>
            <option value="5">⭐⭐⭐⭐⭐ 5</option>
          </select>
        </div>

        {/* 📝 REVIEW */}
        <div>
          <label className="text-white block mb-1">Review</label>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            className="w-full p-2 rounded bg-slate-800 text-white"
            required
          />
        </div>

        <button className="btn-primary">
          Submit Review
        </button>
      </form>
    </div>
  );
};

export default AddReview;