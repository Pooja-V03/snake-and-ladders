
const CONFIG = {
  CELL : 56,
  GAP  : 3,
  get STEP() { return this.CELL + this.GAP; },

  FACES: { 1:'⚀', 2:'⚁', 3:'⚂', 4:'⚃', 5:'⚄', 6:'⚅' },

  PLAYER_CONFIGS: [
    { token:'🧁', color:'#ec4899', bg:'#fce7f3', name:'Player 1' },
    { token:'🤖', color:'#a855f7', bg:'#ede9fe', name:'Player 2' },
    { token:'🌟', color:'#d97706', bg:'#fef3c7', name:'Player 3' },
    { token:'🐸', color:'#16a34a', bg:'#dcfce7', name:'Player 4' },
  ],

  SNAKES: {
    97:78, 95:56, 88:24,
    62:19, 48:26, 36:6, 32:10,
  },

  LADDERS: {
    1:38,  4:14,  9:31,
    20:41, 28:84, 40:59,
    51:67, 63:81, 71:91,
  },
};