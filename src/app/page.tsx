import { getPosts } from "@/actions/post.action";
import { getDbUserId } from "@/actions/user.action";
import CreatePost from "@/components/post/create-post";
import PostCard from "@/components/post/post-card";
import FollowSuggestion from "@/components/suggestion/follow";
import { currentUser } from "@clerk/nextjs/server";

const Home = async () => {
  const user = await currentUser();
  const posts = await getPosts();
  const userId = await getDbUserId();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
      <div className="lg:col-span-6">
        {user ? <CreatePost /> : null}

        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} dbUserId={userId} />
          ))}
        </div>
      </div>
      <div className="hidden lg:block lg:col-span-4 sticky top-20">
        <FollowSuggestion />
      </div>
    </div>
  );
};

export default Home;
