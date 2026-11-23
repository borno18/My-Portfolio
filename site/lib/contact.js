export const emailAddress = 'joydipmajumdarborno@gmail.com';

export const topics = ['Job opportunity', 'Project collaboration', 'Photography', 'General inquiry'];

export function emailDraft({ name, email, topic, message }) {
  const subject = encodeURIComponent(topic + ' · Portfolio');
  const body = encodeURIComponent(message + '\n\nFrom: ' + name + '\nReply to: ' + email);
  return 'mailto:' + emailAddress + '?subject=' + subject + '&body=' + body;
}
