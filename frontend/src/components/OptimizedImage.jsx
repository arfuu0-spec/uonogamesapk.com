export default function OptimizedImage({ src, alt, className }) {
  return (
    <img 
      src={src} 
      alt={alt || "Image"} 
      className={className} 
      loading="lazy" 
    />
  );
}
