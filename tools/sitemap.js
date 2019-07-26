import { bigPictureMethods } from '../src/utils/sharedItemsCalculator';
import fields from '../src/types/fields';
import {createSitemap} from 'sitemap';
import { projectPath, settings } from './settings';
import path from 'path';
const items = JSON.parse(require('fs').readFileSync(path.resolve(projectPath, 'data.json')));
import _ from 'lodash';
import Promise from 'bluebird';



async function main() {
  const sections = _.map(settings.big_picture, (section) => section.url);
  const bigPictureElements = {};
  const landscape = fields.landscape.values;
  for (var section of _.values(settings.big_picture)) {
    const categories = bigPictureMethods[section.method]({bigPictureSettings: settings.big_picture, format: section.url, landscape: landscape});
    bigPictureElements[section.url] = {
      format: section.url,
      urlPart:  section === settings.big_picture.main ? null : section.url,
      categories: categories.map( (x) => x.label)
    }
  }

  const sectionsWithOrder = [{key: 'card-mode', tab_index: 0}].concat( _.keys(settings.big_picture).map(function(key) {
    return {
      key: key,
      tab_index: settings.big_picture[key].tab_index
    }
  }));

  const sitemap = createSitemap({
    hostname: settings.global.website,
    cacheTime: 600 * 1000,
    urls: _.flatten([
      _.orderBy(sectionsWithOrder, 'tab_index').map(function(orderEntry) {
        if (orderEntry.key === 'card-mode') {
          return {
            url: '/format=card-mode',
          };
        }
        const section = settings.big_picture[orderEntry.key];
        return {
          url: orderEntry.key === 'main' ? '/' : `/format=${section.url}`,
          img: [{
            title: section.title,
            url: `images/${section.url}.png`,
            license: 'https://creativecommons.org/licenses/by/4.0/'
          }].concat ( orderEntry.key === 'main' ? [{
            title: `${settings.global.short_name} Landscape Logo`,
            url: 'images/left-logo.svg'
          }, {
            title: `${settings.global.short_name} Logo`,
            url: 'images/right-logo.svg'
          }] : [])
        };
      }),
      items.map(function(item) {
        const landscapeInfo = _.find(bigPictureElements, function(entry) {
          return entry.categories.indexOf(item.category) !== -1;
        });

        const formatPart = (function() {
          if (!landscapeInfo) {
            return 'format=card-mode&'
          }
          if (!landscapeInfo.urlPart) {
            return ''
          }
          return `format=${landscapeInfo.urlPart}&`;
        })();

        return {
          url: `${formatPart}selected=${item.id}`,
          img: [{
            url: item.href,
            title: `${item.name} logo`
          }]
        };
      })
    ])
  });
  require('fs').writeFileSync(path.resolve(projectPath, 'dist/sitemap.xml'), sitemap);
}
main().catch(function(ex) {
  console.info(ex);
  process.exit(1);
});
