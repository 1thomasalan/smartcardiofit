// Ink-brush visuals: motifs drawn as sumi strokes, an enso, a hanko seal, and the journey map.
(function(){
// Each motif: strokes (sumi) | fills | shu (vermilion accent). viewBox 0 0 100 100.
const M={
glass:{s:'M32 24 L38 82 Q50 86 62 82 L68 24 M35 46 Q50 52 65 46',f:'M36 48 Q50 53 64 48 L61 80 Q50 84 39 80 Z',fo:.18},
cup:{s:'M22 48 Q24 80 50 80 Q76 80 78 48 Z M40 38 Q34 30 40 22 Q46 14 40 8 M58 38 Q52 30 58 22 Q64 14 58 8',shu:'M30 60 Q50 66 70 60'},
mug:{s:'M26 34 L28 80 Q50 86 72 80 L74 34 Z M74 44 Q90 46 88 58 Q86 70 73 68 M42 26 Q38 18 44 12 M56 26 Q52 18 58 12',f:'M28 40 L72 40 L71 50 L29 50 Z',fo:.5},
bowl:{s:'M16 52 Q18 84 50 84 Q82 84 84 52 Z M24 52 Q30 36 42 40 Q50 30 60 40 Q72 36 76 52 M62 30 L90 14 M58 26 L84 8'},
bread:{s:'M18 64 Q14 40 36 36 Q50 26 64 36 Q86 40 82 64 Q50 72 18 64 Z M36 46 L42 56 M50 42 L54 54 M62 46 L66 56'},
fish:{s:'M12 50 Q38 22 68 50 Q38 78 12 50 Z M68 50 L88 34 L84 50 L88 66 Z',shu:'M26 46 m-3 0 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0'},
wave:{s:'M8 60 Q20 44 32 60 Q44 76 56 60 Q68 44 80 60 Q88 70 94 62 M8 76 Q20 62 32 76 Q44 90 56 76 Q68 62 80 76 M20 44 Q30 22 50 30 Q40 34 44 44'},
train:{s:'M22 22 Q22 14 32 14 L68 14 Q78 14 78 22 L78 70 Q78 76 70 76 L30 76 Q22 76 22 70 Z M28 24 L72 24 L72 46 L28 46 Z M30 84 L22 94 M70 84 L78 94',shu:'M34 62 m-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 M66 62 m-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0'},
shop:{s:'M18 42 L18 84 L82 84 L82 42 M12 40 L20 20 L80 20 L88 40 Z M40 84 L40 58 L60 58 L60 84',shu:'M12 40 Q22 50 31 40 Q40 50 50 40 Q60 50 69 40 Q78 50 88 40'},
hand:{s:'M30 88 L30 50 Q30 42 38 44 L38 20 Q38 12 45 13 Q51 14 51 22 L51 44 M51 40 Q52 32 58 33 Q64 34 64 42 L64 48 Q66 42 72 44 Q78 46 76 56 L74 74 Q70 88 56 90'},
sushi:{s:'M14 66 Q14 54 50 54 Q86 54 86 66 Q86 78 50 78 Q14 78 14 66 Z',f:'M18 56 Q30 34 54 38 Q80 40 84 56 Q50 50 18 56 Z',fo:1,fc:'shu',shu:'M28 50 Q50 44 74 50'},
onigiri:{s:'M50 14 Q60 14 80 56 Q90 82 72 84 L28 84 Q10 82 20 56 Q40 14 50 14 Z',f:'M34 62 L66 62 L68 86 L32 86 Z',fo:.85},
juice:{s:'M30 30 L36 86 L64 86 L70 30 Z M56 32 L66 8 L78 6',f:'M33 46 L67 46 L64 84 L36 84 Z',fo:.15,shu:'M44 60 m-5 0 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0'},
book:{s:'M50 28 Q32 18 12 24 L12 78 Q32 72 50 82 Q68 72 88 78 L88 24 Q68 18 50 28 Z M50 28 L50 82 M20 36 Q32 32 42 38 M20 48 Q32 44 42 50 M58 38 Q68 32 80 36'},
pen:{s:'M26 80 L70 22 L80 30 L36 88 Z M26 80 L22 94 L36 88',shu:'M64 30 L74 38'},
umbrella:{s:'M10 50 Q14 16 50 14 Q86 16 90 50 Q80 42 70 50 Q60 42 50 50 Q40 42 30 50 Q20 42 10 50 Z M50 50 L50 84 Q50 92 42 90 Q36 88 38 82'},
cat:{s:'M28 40 L24 14 L42 30 Q50 28 58 30 L76 14 L72 40 Q80 60 66 74 Q50 84 34 74 Q20 60 28 40 Z M66 74 Q86 80 88 62 M40 52 L44 52 M56 52 L60 52',shu:'M48 60 L52 60 L50 63 Z'},
dog:{s:'M30 30 Q20 30 16 50 Q22 56 28 48 M70 30 Q80 30 84 50 Q78 56 72 48 M30 30 Q50 18 70 30 Q76 60 64 74 Q50 82 36 74 Q24 60 30 30 Z M40 48 L42 48 M58 48 L60 48',shu:'M45 60 Q50 66 55 60'},
car:{s:'M10 66 L14 52 Q18 46 28 44 L36 32 Q40 28 50 28 L66 28 Q74 28 78 36 L84 46 Q92 50 90 66 Z M38 44 L42 34 L62 34 L66 44 Z',shu:'M28 68 m-7 0 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0 M72 68 m-7 0 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0'},
mountain:{s:'M6 84 L40 26 L54 48 L64 36 L94 84 M30 44 Q40 50 48 42'},
fuji:{s:'M4 84 Q30 64 40 30 L60 30 Q70 64 96 84 M40 30 L44 42 L50 36 L56 44 L60 30',shu:'M76 22 m-10 0 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0'},
boat:{s:'M10 60 L90 60 L76 78 L24 78 Z M50 60 L50 14 L76 52 L50 52 M6 88 Q20 82 34 88 Q48 94 62 88 Q76 82 94 88'},
castle:{s:'M20 84 L80 84 M24 84 L24 62 L76 62 L76 84 M14 62 Q50 50 86 62 M30 50 L70 50 L70 38 L30 38 Z M20 38 Q50 26 80 38 M38 26 L62 26 L62 18 L38 18 Z M30 18 Q50 8 70 18 M44 84 L44 72 L56 72 L56 84'},
question:{s:'M34 34 Q34 14 52 14 Q70 14 70 30 Q70 42 52 50 L52 62',shu:'M52 78 m-5 0 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0'},
toilet:{s:'M30 26 m-6 0 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0 M30 36 L30 62 M22 40 L22 58 L38 58 L38 40 Z M26 62 L26 86 M34 62 L34 86 M70 26 m-6 0 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0 M60 66 L70 38 L80 66 Z M66 66 L66 86 M74 66 L74 86 M50 18 L50 90'},
hotel:{s:'M24 88 L24 16 L76 16 L76 88 M34 28 L44 28 M56 28 L66 28 M34 44 L44 44 M56 44 L66 44 M34 60 L44 60 M56 60 L66 60 M44 88 L44 74 L56 74 L56 88'},
heart:{s:'M50 84 Q14 58 16 36 Q18 18 34 18 Q46 18 50 32 Q54 18 66 18 Q82 18 84 36 Q86 58 50 84 Z',f:'M50 78 Q20 56 22 38 Q24 24 34 24 Q46 24 50 38 Q54 24 66 24 Q76 24 78 38 Q80 56 50 78 Z',fo:.9,fc:'shu'},
camera:{s:'M12 34 L32 34 L38 24 L62 24 L68 34 L88 34 L88 80 L12 80 Z M50 57 m-15 0 a15 15 0 1 0 30 0 a15 15 0 1 0 -30 0',shu:'M50 57 m-7 0 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0'},
clock:{s:'M50 52 m-34 0 a34 34 0 1 0 68 0 a34 34 0 1 0 -68 0 M50 52 L50 28 M50 52 L66 62',shu:'M50 52 m-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0'},
ramen:{s:'M12 50 L88 50 Q86 84 50 86 Q14 84 12 50 Z M24 50 Q28 30 34 50 Q38 30 44 50 Q48 30 54 50 M60 26 L84 50 M68 18 L90 44',shu:'M66 42 m-7 0 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0'},
tempura:{s:'M20 76 Q14 58 30 44 Q50 26 72 22 Q84 22 80 34 Q72 52 50 66 Q36 76 20 76 Z M30 58 L36 52 M44 50 L50 44 M58 40 L64 34 M80 22 L92 12'},
tower:{s:'M50 8 L50 20 M44 20 L56 20 L64 56 L36 56 Z M36 56 L28 92 M64 56 L72 92 M32 74 L68 74 M40 38 L60 38',shu:'M46 20 L54 20 L58 38 L42 38 Z'},
torii:{s:'M10 22 Q50 12 90 22 M18 34 L82 34 M28 22 L26 92 M72 22 L74 92 M48 22 L48 34',shu:'M10 22 Q50 12 90 22 L88 28 Q50 20 12 28 Z'},
snow:{s:'M50 12 L50 88 M17 31 L83 69 M17 69 L83 31 M42 18 L50 26 L58 18 M42 82 L50 74 L58 82'},
sakura:{s:'M50 50 Q38 30 50 14 Q62 30 50 50 Q70 36 86 46 Q76 64 50 50 Q66 70 60 88 Q42 82 50 50 Q34 70 16 70 Q14 52 50 50 Q30 40 22 24 Q40 18 50 50',shu:'M50 50 m-5 0 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0'},
fireworks:{s:'M50 50 L50 14 M50 50 L76 24 M50 50 L86 50 M50 50 L76 76 M50 50 L50 86 M50 50 L24 76 M50 50 L14 50 M50 50 L24 24',shu:'M50 10 m-3 0 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0 M88 50 m-3 0 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0 M22 22 m-3 0 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0 M78 78 m-3 0 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0'},
no:{s:'M50 50 m-34 0 a34 34 0 1 0 68 0 a34 34 0 1 0 -68 0',shu:'M26 26 L74 74'},
sake:{s:'M38 14 L62 14 L60 26 Q78 40 74 86 L26 86 Q22 40 40 26 Z',shu:'M36 52 L64 52 L64 68 L36 68 Z'},
meat:{s:'M20 60 Q14 34 42 28 Q70 22 80 44 Q88 66 62 74 Q34 82 20 60 Z M78 50 L94 44 M42 44 Q54 40 62 50'},
egg:{s:'M50 14 Q26 16 24 56 Q24 86 50 86 Q76 86 76 56 Q74 16 50 14 Z',shu:'M50 60 m-11 0 a11 11 0 1 0 22 0 a11 11 0 1 0 -22 0'},
pizza:{s:'M50 88 L14 22 Q50 6 86 22 Z M18 30 Q50 18 82 30',shu:'M44 42 m-5 0 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0 M58 54 m-5 0 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0 M46 66 m-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0'},
salad:{s:'M12 52 Q14 84 50 84 Q86 84 88 52 Z M22 52 Q26 34 40 40 Q46 26 58 36 Q70 28 78 52',shu:'M44 46 m-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 M64 46 m-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0'},
tree:{s:'M50 90 L50 54 M50 66 L36 54 M50 60 L62 50 M50 54 Q20 56 22 36 Q20 16 42 14 Q50 4 62 12 Q84 14 80 36 Q82 56 50 54 Z'},
cart:{s:'M8 18 L22 18 L32 66 L78 66 L86 30 L26 30 M36 44 L80 44',shu:'M38 80 m-6 0 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0 M72 80 m-6 0 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0'},
bank:{s:'M12 34 L50 12 L88 34 Z M16 86 L84 86 M22 40 L22 80 M40 40 L40 80 M60 40 L60 80 M78 40 L78 80 M12 80 L88 80'},
yen:{s:'M50 50 m-36 0 a36 36 0 1 0 72 0 a36 36 0 1 0 -72 0 M36 30 L50 52 L64 30 M50 52 L50 74 M38 54 L62 54 M38 64 L62 64'},
gym:{s:'M16 36 L16 64 M26 28 L26 72 M74 28 L74 72 M84 36 L84 64 M26 50 L74 50'},
work:{s:'M14 34 L86 34 L86 82 L14 82 Z M38 34 L38 24 Q38 18 44 18 L56 18 Q62 18 62 24 L62 34 M14 54 Q50 62 86 54',shu:'M46 54 L54 54 L54 62 L46 62 Z'},
party:{s:'M20 86 L40 30 L76 66 Z M50 20 Q56 12 62 18 M78 28 L88 22 M74 46 Q82 44 88 50',shu:'M58 10 m-3 0 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0 M86 36 m-3 0 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0'},
hospital:{s:'M16 88 L16 30 L84 30 L84 88 M40 88 L40 70 L60 70 L60 88',shu:'M44 38 L56 38 L56 46 L64 46 L64 56 L56 56 L56 64 L44 64 L44 56 L36 56 L36 46 L44 46 Z'},
plane:{s:'M50 8 Q56 10 56 22 L56 40 L90 58 L90 66 L56 56 L56 76 L66 84 L66 90 L50 86 L34 90 L34 84 L44 76 L44 56 L10 66 L10 58 L44 40 L44 22 Q44 10 50 8 Z'},
film:{s:'M14 24 L86 24 L86 76 L14 76 Z M14 36 L86 36 M14 64 L86 64 M24 24 L24 36 M40 24 L40 36 M56 24 L56 36 M72 24 L72 36 M24 64 L24 76 M40 64 L40 76 M56 64 L56 76 M72 64 L72 76',shu:'M44 42 L60 50 L44 58 Z'},
sun:{s:'M50 6 L50 16 M50 84 L50 94 M6 50 L16 50 M84 50 L94 50 M19 19 L26 26 M74 74 L81 81 M19 81 L26 74 M74 26 L81 19',f:'M50 50 m-24 0 a24 24 0 1 0 48 0 a24 24 0 1 0 -48 0',fo:1,fc:'shu'},
sunrise:{s:'M6 70 L94 70 M14 82 L86 82 M26 92 L74 92 M50 22 L50 32 M22 34 L28 40 M78 34 L72 40',f:'M24 70 A26 26 0 0 1 76 70 Z',fo:1,fc:'shu'},
moon:{s:'M62 14 Q30 18 30 50 Q30 82 62 86 Q40 72 40 50 Q40 28 62 14 Z M74 30 L74 30.5 M82 52 L82 52.5 M70 70 L70 70.5'},
one:{s:'',shu:'M50 50 m-12 0 a12 12 0 1 0 24 0 a12 12 0 1 0 -24 0'},
two:{s:'',shu:'M32 50 m-12 0 a12 12 0 1 0 24 0 a12 12 0 1 0 -24 0 M68 50 m-12 0 a12 12 0 1 0 24 0 a12 12 0 1 0 -24 0'},
three:{s:'',shu:'M50 30 m-11 0 a11 11 0 1 0 22 0 a11 11 0 1 0 -22 0 M30 66 m-11 0 a11 11 0 1 0 22 0 a11 11 0 1 0 -22 0 M70 66 m-11 0 a11 11 0 1 0 22 0 a11 11 0 1 0 -22 0'},
four:{s:'',shu:'M32 32 m-10 0 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0 M68 32 m-10 0 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0 M32 68 m-10 0 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0 M68 68 m-10 0 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0'},
five:{s:'',shu:'M28 28 m-9 0 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0 M72 28 m-9 0 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0 M50 50 m-9 0 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0 M28 72 m-9 0 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0 M72 72 m-9 0 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0'},
six:{s:'',shu:'M30 24 m-9 0 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0 M70 24 m-9 0 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0 M30 50 m-9 0 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0 M70 50 m-9 0 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0 M30 76 m-9 0 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0 M70 76 m-9 0 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0'},
menu:{s:'M24 12 L76 12 L76 88 L24 88 Z M34 30 L66 30 M34 44 L60 44 M34 56 L64 56 M34 68 L56 68',shu:'M44 20 L56 20'},
map:{s:'M10 22 L36 12 L64 22 L90 12 L90 78 L64 88 L36 78 L10 88 Z M36 12 L36 78 M64 22 L64 88',shu:'M50 44 Q50 30 58 34 Q62 40 50 56 Q38 40 42 34 Q50 30 50 44 Z'},
wifi:{s:'M14 40 Q50 8 86 40 M26 54 Q50 32 74 54 M38 68 Q50 58 62 68',shu:'M50 80 m-5 0 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0'},
receipt:{s:'M26 8 L74 8 L74 90 L66 84 L58 90 L50 84 L42 90 L34 84 L26 90 Z M36 26 L64 26 M36 40 L64 40 M36 54 L56 54',shu:'M36 70 L64 70'},
eye:{s:'M8 50 Q50 10 92 50 Q50 90 8 50 Z',shu:'M50 50 m-13 0 a13 13 0 1 0 26 0 a13 13 0 1 0 -26 0'},
ticket:{s:'M10 30 L90 30 L90 44 Q82 50 90 56 L90 70 L10 70 L10 56 Q18 50 10 44 Z M64 30 L64 70',shu:'M24 46 L52 46 M24 56 L44 56'},
photo:{s:'M14 20 L86 20 L86 80 L14 80 Z M20 72 L42 46 L56 62 L64 54 L80 72',shu:'M66 34 m-6 0 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0'},
cake:{s:'M18 50 L82 50 L82 86 L18 86 Z M18 64 Q34 72 50 64 Q66 72 82 64 M36 50 L36 36 M50 50 L50 36 M64 50 L64 36',shu:'M36 30 Q32 24 36 18 Q40 24 36 30 M50 30 Q46 24 50 18 Q54 24 50 30 M64 30 Q60 24 64 18 Q68 24 64 30'},
steam:{s:'M30 84 Q20 64 34 50 Q48 36 36 16 M52 84 Q42 64 56 50 Q70 36 58 16 M74 84 Q64 64 78 50 Q88 40 82 24'},
wind:{s:'M8 36 L62 36 Q78 36 76 22 Q72 12 62 18 M8 52 L80 52 Q94 52 92 66 Q88 78 76 70 M8 68 L50 68'},
talk:{s:'M14 20 L76 20 Q86 20 86 30 L86 56 Q86 66 76 66 L40 66 L24 82 L26 66 L24 66 Q14 66 14 56 L14 30 Q14 20 24 20 Z',shu:'M34 43 L34 44 M50 43 L50 44 M66 43 L66 44'},
bird:{s:'M14 58 Q30 34 54 44 Q66 28 80 32 L92 30 L82 38 Q84 62 58 72 Q34 80 14 58 Z M40 58 Q52 50 62 56 M48 72 L44 88 M58 72 L60 88',shu:'M76 36 m-2 0 a2 2 0 1 0 4 0 a2 2 0 1 0 -4 0'},
bus:{s:'M16 18 L84 18 Q90 18 90 26 L90 74 L10 74 L10 26 Q10 18 16 18 Z M18 28 L82 28 L82 48 L18 48 Z M40 28 L40 48 M62 28 L62 48',shu:'M26 78 m-6 0 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0 M74 78 m-6 0 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0'},
people:{s:'M34 26 m-9 0 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0 M66 30 m-8 0 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0 M18 88 Q18 44 34 42 Q50 44 50 88 M52 88 Q52 48 66 46 Q82 48 82 88',shu:'M42 64 Q50 58 58 64'},
taxi:{s:'M10 66 L14 52 Q18 46 28 44 L36 32 Q40 28 50 28 L66 28 Q74 28 78 36 L84 46 Q92 50 90 66 Z M38 44 L42 34 L62 34 L66 44 Z',shu:'M44 18 L62 18 L62 28 L44 28 Z M28 68 m-7 0 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0 M72 68 m-7 0 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0'},
flag:{s:'M18 92 L18 10 M18 14 L86 14 L86 60 L18 60 M18 26 L86 26 M18 38 L86 38 M18 50 L86 50',shu:'M18 14 L46 14 L46 38 L18 38 Z'},
palm:{s:'M52 92 Q48 60 54 34 M54 34 Q34 22 14 32 M54 34 Q48 14 30 10 M54 34 Q66 14 84 16 M54 34 Q78 30 90 46 M54 34 Q40 40 30 56',shu:'M50 40 m-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0'},
tv:{s:'M12 26 L88 26 L88 76 L12 76 Z M38 10 L50 26 L62 10 M34 88 L66 88'},
ball:{s:'M50 50 m-34 0 a34 34 0 1 0 68 0 a34 34 0 1 0 -68 0',shu:'M28 24 Q40 50 28 76 M72 24 Q60 50 72 76'},
music:{s:'M36 76 L36 22 L80 12 L80 66',f:'M36 76 m-12 0 a12 9 0 1 0 24 0 a12 9 0 1 0 -24 0 M80 66 m-12 0 a12 9 0 1 0 24 0 a12 9 0 1 0 -24 0',fo:1},
radio:{s:'M12 36 L88 36 L88 82 L12 82 Z M22 36 L70 12 M24 50 L52 50 M24 60 L52 60 M24 70 L52 70',shu:'M70 60 m-10 0 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0'},
mic:{s:'M36 14 Q36 8 50 8 Q64 8 64 14 L64 48 Q64 58 50 58 Q36 58 36 48 Z M24 44 Q24 72 50 72 Q76 72 76 44 M50 72 L50 90 M36 90 L64 90'},
paper:{s:'M14 18 L86 18 L86 84 L14 84 Z M22 30 L78 30 M22 44 L46 44 M22 56 L46 56 M22 68 L46 68 M56 44 L78 44 L78 68 L56 68 Z'},
mail:{s:'M10 24 L90 24 L90 78 L10 78 Z M10 24 L50 56 L90 24'},
apple:{s:'M50 30 Q30 18 20 38 Q10 64 30 84 Q40 92 50 84 Q60 92 70 84 Q90 64 80 38 Q70 18 50 30 Z M50 30 Q50 18 56 10',shu:'M54 22 Q66 10 76 16 Q66 26 54 22 Z'},
feet:{s:'M30 70 Q22 58 28 46 Q36 40 40 52 Q42 64 36 72 Z M62 44 Q54 32 60 20 Q68 14 72 26 Q74 38 68 46 Z',shu:'M30 78 m-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 M64 52 m-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0'},
broom:{s:'M70 10 L44 62 M30 56 L58 70 L48 92 Q30 90 20 80 Z M28 74 L40 80 M34 66 L46 72'},
pan:{s:'M10 50 L66 50 Q66 76 38 76 Q10 76 10 50 Z M66 54 L92 46 M24 40 Q20 32 26 24 M40 40 Q36 32 42 24',shu:'M38 60 m-8 0 a8 6 0 1 0 16 0 a8 6 0 1 0 -16 0'},
house:{s:'M10 50 L50 16 L90 50 M20 42 L20 86 L80 86 L80 42 M42 86 L42 62 L58 62 L58 86',shu:'M64 30 L64 18 L74 18 L74 38'},
calendar:{s:'M14 22 L86 22 L86 86 L14 86 Z M14 38 L86 38 M32 12 L32 30 M68 12 L68 30 M26 52 L34 52 M46 52 L54 52 M66 52 L74 52 M26 68 L34 68 M46 68 L54 68',shu:'M62 62 L78 62 L78 76 L62 76 Z'},
star:{s:'M50 10 L60 38 L90 38 L66 56 L74 86 L50 68 L26 86 L34 56 L10 38 L40 38 Z'},
path:{s:'M20 92 Q30 70 50 64 Q74 56 66 40 Q58 26 74 12 M38 92 Q48 74 64 70 Q90 62 82 40 Q76 28 86 14',shu:'M28 30 L28 8 M18 12 Q28 6 38 12 M20 18 L36 18'}
};
const B={};
function mk(name,cls=''){const m=M[name];if(!m)return null;let h='';
 if(m.f)h+=`<path d="${m.f}" class="${m.fc==='shu'?'vf':'if'}" style="opacity:${m.fo??.2}"/>`;
 if(m.s)h+=`<path d="${m.s}" class="is"/>`;
 if(m.shu)h+=`<path d="${m.shu}" class="vs"/>`;
 return h}
window.motif=function(name,label){const h=mk(name);
 if(!h){const ch=(label||'・').slice(0,1);return `<svg viewBox="0 0 100 100" class="mo" aria-hidden="true"><path class="is" d="${ENSO_SM}"/><text x="50" y="62" text-anchor="middle" class="mot">${ch}</text></svg>`}
 return `<svg viewBox="0 0 100 100" class="mo" aria-hidden="true"><g filter="url(#brush)">${h}</g></svg>`};
const ENSO_SM='M70 22 Q50 10 30 22 Q12 36 16 58 Q22 82 48 86 Q74 88 84 64 Q90 44 78 30';
// Brush enso: tapered stroke built as a filled ribbon.
function ensoPath(cx,cy,r,start=-1.9,sweep=5.6,w0=1.5,w1=9,seed=1){const pts=[],N=80;let rnd=seed;const rn=()=>{rnd=(rnd*9301+49297)%233280;return rnd/233280};
 for(let i=0;i<=N;i++){const t=i/N,a=start+sweep*t,rr=r*(1+.03*Math.sin(t*9+seed)),w=w0+(w1-w0)*Math.sin(Math.PI*Math.min(1,t*1.15))*(1-.35*t)+rn()*.8;pts.push([cx+Math.cos(a)*rr,cy+Math.sin(a)*rr,w,a])}
 const out=pts.map(p=>[p[0]+Math.cos(p[3])*p[2]/2,p[1]+Math.sin(p[3])*p[2]/2]),inn=pts.map(p=>[p[0]-Math.cos(p[3])*p[2]/2,p[1]-Math.sin(p[3])*p[2]/2]).reverse();
 return 'M'+out.concat(inn).map(p=>p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' L')+' Z'}
window.ensoPath=ensoPath;
window.scene=function(L,n){const m=mk(L.sc)||mk('cup');const words=L.w.map(w=>w[4]).filter(Boolean);
 const smalls=words.slice(0,3).map((k,i)=>{const h=mk(k);if(!h)return'';const x=[34,100,166][i];return `<g transform="translate(${x-17} 196) scale(.34)" opacity=".85">${h}</g>`}).join('');
 return `<svg viewBox="0 0 200 240" class="scene" role="img" aria-label="${L.t}">
 <path d="${ensoPath(100,100,78,-1.75,5.55,1,10,n)}" class="ensof"/>
 <g transform="translate(55 55) scale(.9)" filter="url(#brush)">${m}</g>
 <g filter="url(#brush)">${smalls}</g>
 <g transform="translate(160 18)"><rect width="30" height="30" rx="3" class="seal"/><text x="15" y="21" text-anchor="middle" class="sealt">${n}</text></g>
 </svg>`};
window.ensoProgress=function(p){// p 0..1 drawn enso for the timer
 const sweep=Math.max(.01,p)*5.9;return `<svg viewBox="0 0 120 120" class="ensot"><path d="${ensoPath(60,60,46,-1.7,5.9,1,7,3)}" class="ensobg"/><path d="${ensoPath(60,60,46,-1.7,sweep,1,7,3)}" class="ensofg"/></svg>`};
window.BRUSH_DEFS=`<svg width="0" height="0" style="position:absolute"><defs>
<filter id="brush" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2.6"/></filter>
</defs></svg>`;
// Journey map: winding path of stones, grouped by stage.
window.journey=function(Ls,state,cur,stages){const W=360,rowH=74,pad=60;const pts=[];let y=pad;let lastSt=-1;const labels=[];
 Ls.forEach((L,i)=>{if(L.st!==lastSt){if(lastSt>=0)y+=34;labels.push({y:y-6,t:stages[L.st],i:L.st});y+=30;lastSt=L.st}
  const x=W/2+Math.sin(i*.9)*110;pts.push([x,y]);y+=rowH});
 const H=y+pad/2;let d='M'+pts[0][0]+' '+(pts[0][1]-40);pts.forEach((p,i)=>{if(i===0){d+=` L${p[0]} ${p[1]}`;return}const q=pts[i-1];const my=(q[1]+p[1])/2;d+=` C${q[0]} ${my} ${p[0]} ${my} ${p[0]} ${p[1]}`});
 let h=`<svg viewBox="0 0 ${W} ${H}" class="jmap" style="max-height:none">`;
 h+=`<path d="${d}" class="jpath"/>`;
 labels.forEach(l=>{h+=`<text x="${W/2}" y="${l.y}" text-anchor="middle" class="jstage">${(l.i+1)}. ${l.t}</text>`});
 pts.forEach((p,i)=>{const n=i+1,s=state(n);const L=Ls[i];
  if(s==='done'){h+=`<g class="jn done" data-day="${n}" transform="translate(${p[0]} ${p[1]})"><rect x="-17" y="-17" width="34" height="34" rx="4" transform="rotate(${(i*7)%11-5})" class="seal"/><text y="6" text-anchor="middle" class="sealt">${n}</text></g>`}
  else if(n===cur){h+=`<g class="jn cur" data-day="${n}" transform="translate(${p[0]} ${p[1]})"><circle r="26" class="jpulse"/><path d="${ensoPath(0,0,20,-1.8,5.6,1,5,n)}" class="ensof"/><text y="6" text-anchor="middle" class="jnum">${n}</text></g>`}
  else{h+=`<g class="jn lock" data-day="${n}" transform="translate(${p[0]} ${p[1]})"><circle r="15" class="jdot"/><text y="5" text-anchor="middle" class="jnum dim">${n}</text></g>`}
  const tx=p[0]>W/2?p[0]-30:p[0]+30;h+=`<text x="${tx}" y="${p[1]+5}" text-anchor="${p[0]>W/2?'end':'start'}" class="jlab ${s==='lock'&&n!==cur?'dim':''}">${L.t.replace(/&/g,'&amp;')}</text>`});
 return h+'</svg>'};
})();
