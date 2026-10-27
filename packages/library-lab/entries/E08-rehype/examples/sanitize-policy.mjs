// Exact schema shared by the React example and real SDK tests.
// Disable outbound links/media instead of relying on iframe CSP alone.
export const strictHtmlSchema = {
  tagNames: ['article','h2','h3','h4','p','strong','em','b','i','ul','ol','li',
    'blockquote','code','pre','br','a'],
  attributes: {a: ['title']},
  protocols: {href: []},
  required: {},
  strip: ['script','style','iframe','form','svg','math','object','embed','template','textarea'],
};
