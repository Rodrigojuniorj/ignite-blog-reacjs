/* eslint-disable @typescript-eslint/no-unused-vars */
import Link from 'next/link';
import { GetStaticProps } from 'next';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { AiOutlineCalendar, AiOutlineUser } from 'react-icons/ai';

import Head from 'next/head';
import { RichText } from 'prismic-dom';
import { useState } from 'react';
import Header from '../components/Header';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';

import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [nextPage, setNextPage] = useState<string>(postsPagination.next_page);

  async function handleMorePosts(): Promise<void> {
    const response = await fetch(nextPage);
    const jsonResponse = await response.json();

    const newPosts = jsonResponse.results.map((post: Post) => ({
      uid: post.uid,
      first_publication_date: format(
        new Date(post.first_publication_date),
        'dd MMM yyyy',
        {
          locale: ptBR,
        }
      ),
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    }));

    setPosts([...posts, ...newPosts]);
    setNextPage(jsonResponse.next_page);
  }

  return (
    <>
      <Head>
        <title>Posts | React</title>
      </Head>

      {posts[0] ? (
        <main>
          <div className={styles.posts}>
            {posts.map(post => (
              <Link key={post.uid} href={`/post/${post.uid}`}>
                <a>
                  <strong>{post.data.title}</strong>
                  <p>{post.data.subtitle}</p>
                  <div className={styles.postFooter}>
                    <time>
                      <AiOutlineCalendar size={20} />
                      {format(
                        new Date(post.first_publication_date),
                        'dd MMM yyyy',
                        {
                          locale: ptBR,
                        }
                      )}
                    </time>
                    <span>
                      <AiOutlineUser size={20} /> {post.data.author}
                    </span>
                  </div>
                </a>
              </Link>
            ))}
            {nextPage && (
              <button
                type="button"
                className={styles.loadMorePosts}
                onClick={handleMorePosts}
              >
                Carregar mais posts
              </button>
            )}
          </div>
        </main>
      ) : (
        <div className={styles.posts}>
          <h1>
            <strong>Nenhum Post no momento</strong>
          </h1>
        </div>
      )}
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient({});
  const postsResponse = await prismic.getByType('posts', {
    pageSize: 10,
  });

  const nextPost = postsResponse.next_page
    ? `${postsResponse.next_page}&access_token=${process.env.PRISMIC_ACCESS_TOKEN}`
    : null;

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  return {
    props: {
      postsPagination: {
        next_page: nextPost,
        results: posts,
      },
    },
    revalidate: 60 * 5, // 5  min
  };
};
