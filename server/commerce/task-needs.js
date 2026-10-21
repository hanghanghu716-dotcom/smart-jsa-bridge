// Task-scoped ordinary tools and consumables. Installed machine components,
// lifting clamps and electrical protective tools are not interchangeable with these.
export const TASK_CATEGORIES = ['spirit-level','claw-hammer','trim-pry-bar','precision-screwdriver','bench-vise','adjustable-wrench','wood-clamp','hand-sanding','chalk-line','putty-knife','covering-film','floor-mop','cleaning-bucket','floor-squeegee','scrub-brush','packing-dispenser','shipping-label','marker-pen','hex-key','hand-screwdriver','caulking-gun','masonry-trowel','rubber-mallet','carpenter-square','sewing-scissors','sewing-tape','dish-brush','food-tongs'];
export function taskNeeds(title, body) {
 const needs=[];
 const add=(category,reason,score=80)=>needs.push({category,constraints:{},score,reason,origin:'task-context'});
 const wood=/목재|목공|wood|timber|workbench|mortise|木材|木工/iu.test(title);
 const paint=/수성.*(?:도장|페인트)|벽면.*도장|water.?based.*paint|wall.*paint|水性.*塗/iu.test(title);
 const finish=/석고보드|퍼티|미장|타일|창호|칸막이|블록.*쌓기|도막방수|drywall|putty|tiling|plaster|window frame/iu.test(title);
 const cleaning=/바닥.*수작업 청소|화장실.*청소|manual.*(?:floor|stair).*clean|restroom.*clean|床.*清掃/iu.test(title);
 const packing=/포장|상자 개봉|상자.*적재|packaging|packing|carton|wrapping|梱包/iu.test(title)&&!/아스팔트|도로|asphalt|road/iu.test(title);
 const mechanical=/정비|교체|조립|가체결|체결|maintenance|replacement|restoration|assembl|fasten/iu.test(title)
   && !/활선|전기|전압|분전|배전|결선|애자|감지기|인버터|전신주|가스|산소|아르곤|electri|energized|hydrogen|oxygen|argon|gas|aseptic|semiconductor|sanitary/iu.test(title);
 if((wood||finish)&&/수평|수직|level|vertical|水平|垂直/iu.test(body))add('spirit-level','layout-level-check',68);
 if(wood&&/못|망치|nail|hammer/iu.test(body))add('claw-hammer','wood-nail-work');
 if(/칸막이.*철거|몰딩.*해체|partition.*demolition|trim.*remov/iu.test(title))add('trim-pry-bar','trim-disassembly');
 if(/정밀 드라이버|precision screwdriver/iu.test(body)&&mechanical)add('precision-screwdriver','small-fastener-work');
 // A tilting hobby vise is not a drill-press or milling-machine fixture.
 if(wood&&/수작업|hand.tool|hand.work/iu.test(body)&&/바이스|bench vise/iu.test(body))add('bench-vise','hand-bench-work');
 if(mechanical&&/볼트|너트|렌치|bolt|nut|wrench|spanner/iu.test(body))add('adjustable-wrench','general-fastener-tools',72);
 if(wood&&/클램프|고정|clamp|secur|固定/iu.test(body))add('wood-clamp','wood-workpiece-holding',88);
 if(wood&&/연마|샌딩|마감|sanding|finish/iu.test(body)||/퍼티|putty/iu.test(title))add('hand-sanding','manual-surface-preparation',77);
 if((wood||finish)&&/표시|먹매김|먹줄|mark|layout|墨/iu.test(body))add('chalk-line','layout-marking',73);
 if(paint||/퍼티|putty|drywall joint/iu.test(title))add('putty-knife','wall-surface-preparation',79);
 if(paint)add('covering-film','paint-area-covering',81);
 if(cleaning){add('floor-mop','manual-floor-cleaning',88);add('cleaning-bucket','cleaning-water-container',76);add('floor-squeegee','manual-water-removal',84);add('scrub-brush','manual-surface-scrubbing',82);}
 if(packing){add('packing-dispenser','carton-tape-dispensing',74);if(/라벨|품목|label|identif/iu.test(body))add('shipping-label','package-identification',78);}
 if(/표시|마킹|마크|mark|label|identify/iu.test(body)&&!/무균|반도체|aseptic|semiconductor/iu.test(title))add('marker-pen','workpiece-identification',46);
 if(mechanical&&/육각|hex.key|allen/iu.test(body))add('hex-key','hex-fastener-tools',83);
 if(mechanical&&/나사|screw(?! conveyor)/iu.test(body))add('hand-screwdriver','general-screw-work',74);
 if(/코킹|실리콘.*시공|caulk|sealant.*appl/iu.test(title))add('caulking-gun','manual-sealant-application',90);
 if(/모르타르|미장|블록.*쌓기|mortar|plaster|block.*lay/iu.test(title))add('masonry-trowel','mortar-finishing',90);
 if(/타일.*시공|블록.*쌓기|tiling|block.*lay/iu.test(title))add('rubber-mallet','layout-seating',78);
 if(wood&&/직각|수직|절단선|square|right.angle|cut.line/iu.test(body))add('carpenter-square','wood-square-marking',84);
 if(/봉제|미싱|sewing/iu.test(title)){add('sewing-scissors','fabric-cutting',85);add('sewing-tape','fabric-length-check',80);}
 if(/식기.*세척|dish.*wash/iu.test(title))add('dish-brush','manual-dish-cleaning',85);
 if(/배식|식재료 손질|food.*serv|food.*prep/iu.test(title))add('food-tongs','food-handling',85);
 return needs;
}
