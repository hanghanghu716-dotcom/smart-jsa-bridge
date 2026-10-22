// Stable filter IDs shared by the guide and its server-side catalogue selector.
export const PPE_GROUPS = [
 {id:'head',number:1,categories:['safety-helmet']},
 {id:'eyes-face',number:2,categories:['safety-glasses','safety-goggles','face-shield','welding-helmet']},
 {id:'hearing',number:3,categories:['earplugs','earmuffs']},
 {id:'respiratory',number:4,categories:['particulate-respirator','reusable-respirator','respirator-filter','supplied-air-respirator','escape-breathing-apparatus']},
 {id:'hands',number:5,categories:['work-gloves','cut-resistant-gloves','chemical-resistant-gloves','heat-resistant-gloves','electrical-insulating-gloves']},
 {id:'feet',number:6,categories:['safety-footwear','chemical-resistant-boots','electrical-insulating-boots']},
 {id:'fall',number:7,categories:['fall-arrest-harness','fall-arrest-lanyard','self-retracting-lifeline']},
 {id:'clothing',number:8,categories:['protective-coverall','contamination-coverall','chemical-protective-clothing','flame-resistant-clothing','high-visibility-clothing']},
];
export const ppeGroupFor = category => PPE_GROUPS.find(group=>group.categories.includes(category))?.id || null;
export const normalizePpeGroup = value => PPE_GROUPS.some(group=>group.id===value) ? value : 'all';
export function filterPpeProducts(items,group='all',search='') {
 const query=String(search).normalize('NFKC').trim().toLocaleLowerCase();
 return items.filter(item=>(group==='all'||ppeGroupFor(item.category)===group)
   &&(!query||[item.title,item.merchant,item.purposeLabel].filter(Boolean).join(' ').normalize('NFKC').toLocaleLowerCase().includes(query)));
}
