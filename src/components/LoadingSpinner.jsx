const LoadingSpinner = ({ text = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="spinner" />
      <p className="text-slate-400 text-sm animate-pulse">{text}</p>
    </div>
  );
};

export default LoadingSpinner;
