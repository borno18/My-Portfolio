import { createClient } from '@supabase/supabase-js';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

const basePosts = [{
  slug: 'correcting-a-tournament-result',
  title: 'What happens when a tournament result changes?',
  description: 'How SWE Sports Week corrects a bracket without clearing its unrelated matches.',
  isProjectNote: true,
  body: `An organizer can enter the wrong winner even with a good interface. A tournament system needs a way to recover, because a result can determine who plays in the next round.

## A small example

Suppose team A advances from a semifinal. If the organizer later corrects the result to team B, the final can no longer use A as a participant. The corrected participant moves forward, and any downstream result that relied on the old winner is cleared. The other semifinal remains intact.

## Save the change together

The [SWE Sports Week project](/work/swe-sports-week) records the result, its propagation, and the change history in one transaction. A version check catches an edit from an out-of-date organizer screen. Public pages check a small revision endpoint so they only reload tournament content when there is a change.

The design question is whether each later result still makes sense after the edit. Testing with byes and different bracket sizes gives that rule more coverage than testing just a clean eight-team example.`,
}, {
  slug: 'offline-attendance',
  title: 'Taking classroom attendance without Wi-Fi',
  description: 'How a nearby device session and on-device storage keep the classroom workflow moving.',
  isProjectNote: true,
  body: `Attendance has three parts: knowing who belongs to the class, recording check-ins, and giving the instructor a usable record afterwards. The [Smart Proximity Attendance app](/work/attendance-app) keeps those steps on the devices in the room.

## Start with the roster

An instructor can import a roster and use it again for later sessions. This separates the work of preparing the class list from the work of checking who arrived that day.

## Keep the session local

During class, the instructor’s device advertises a nearby session. Student devices connect locally, and the instructor can see check-ins accumulate without waiting on campus Wi-Fi.

## Make the record portable

The device retains session history in SQLite. A CSV export gives instructors a familiar format to inspect or take into another tool after the session ends.`,
}, {
  slug: 'pookie-prep-offline',
  title: 'How Pookie Prep works offline',
  description: 'Bundled questions, local progress, and a Bengali-first practice interface.',
  isProjectNote: true,
  body: `[Pookie Prep](/work/pookie-prep) is built for short study sessions on Android. The question bank ships with the app, so a learner can open a practice session on an unreliable connection after installation.

## Keep the practice loop on the device

Learners select topics and session length, then answer questions at their own pace or under a timer. Progress and missed questions are kept on-device. That lets the mistake notebook take a learner back to earlier answers without a server call.

## Match the practice context

The app uses Bengali labels and numerals and includes the exam’s negative marking in its practice scoring. Offline storage and Bengali typography are both part of making the app fit the people using it.`,
}];

export const env = name => process.env[name] || import.meta.env?.[name];

function reader() {
  const url = env('SUPABASE_URL');
  const key = env('SUPABASE_PUBLISHABLE_KEY');
  return url && key ? createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(12000) }) },
  }) : null;
}

export async function getPosts() {
  const db = reader();
  if (!db) return basePosts;
  const { data, error } = await db.from('portfolio_posts')
    .select('slug,title,description,body,published_at').eq('status', 'published').order('published_at', { ascending: false });
  if (error) throw new Error('Could not build the published blog from Supabase');
  const slugs = new Set(data.map(post => post.slug));
  return [...data, ...basePosts.filter(post => !slugs.has(post.slug))];
}

export async function getPublishedPhotos() {
  const db = reader();
  if (!db) return [];
  const { data, error } = await db.from('portfolio_photos')
    .select('id,title,category,caption,alt,public_id,version,cloud_name,width,height').order('created_at', { ascending: false });
  if (error) throw new Error('Could not build the published gallery from Supabase');
  return data;
}

export function renderMarkdown(body) {
  return sanitizeHtml(marked.parse(body, { async: false }), {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, 'img'],
    allowedAttributes: { a: ['href', 'title', 'target', 'rel', 'aria-describedby'], img: ['src', 'alt', 'title', 'width', 'height'] },
    transformTags: {
      a: (_, { href, title }) => {
        const attributes = { href, title };
        if (href && /^(?:https:\/\/|\/(?!\/)|\.{1,2}\/|[a-z0-9._-]+(?:[/?]|$))/i.test(href)) {
          Object.assign(attributes, { target: '_blank', rel: 'noopener noreferrer', 'aria-describedby': 'new-tab-description' });
        }
        return { tagName: 'a', attribs: Object.fromEntries(Object.entries(attributes).filter(([, value]) => value != null)) };
      },
    },
    allowedSchemes: ['https', 'mailto'],
    allowProtocolRelative: false,
    allowedSchemesAppliedToAttributes: ['href', 'src'],
  });
}

export function cloudImage(photo, width) {
  if (!/^[a-zA-Z0-9_-]+$/.test(photo.cloud_name) || !/^portfolio\/[a-f0-9-]{36}$/.test(photo.public_id) || !/^\d+$/.test(String(photo.version))) return '';
  return `https://res.cloudinary.com/${photo.cloud_name}/image/upload/f_auto,q_auto,c_limit,w_${width}/v${photo.version}/${photo.public_id}.jpg`;
}
