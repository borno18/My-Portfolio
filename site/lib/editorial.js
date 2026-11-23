const covers = {
  'correcting-a-tournament-result': 'sports',
  'offline-attendance': 'attendance',
  'pookie-prep-offline': 'pookie',
};

export function editorialDetails(post) {
  const words = post.body.trim().split(/\s+/).length;
  return {
    cover: covers[post.slug],
    category: post.isProjectNote ? 'Project notes' : 'Engineering',
    minutes: Math.max(1, Math.ceil(words / 220)) + ' min read',
    date: post.published_at ? new Intl.DateTimeFormat('en', {
      dateStyle: 'long',
      timeZone: 'Asia/Dhaka',
    }).format(new Date(post.published_at)) : '',
  };
}
