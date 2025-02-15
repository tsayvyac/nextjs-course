import Link from "next/link";

const NotFound = () => {
  return (
    <div>
      <h2>Page not found</h2>
      <Link href="/">Return home</Link>
    </div>
  );
};

export default NotFound;
