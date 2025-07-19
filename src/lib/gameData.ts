export const mommy = 'Mommy';
export const daddy = 'Daddy';
export const maleCelebrities = [
    'Owen Wilson', 'Benedict Cumberbatch', 'Rupert Grint', 'Timothee Chalamet', 'Daddy'
];
export const femaleCelebrities = [
    'Priyanka Chopra', 'Halle Berry', 'Zendaya', 'Mindy Kaling'
];

export const gameData = [
    {
        babyId: 'baby1',
        babyImage: 'https://raw.githubusercontent.com/madelinengo/baby-shower-game/refs/heads/main/images/pics_baby/dad_halle.jpeg',
        correctParents: { mom: daddy, dad: 'Halle Berry' }
    },
    {
        babyId: 'baby2',
        babyImage: 'https://raw.githubusercontent.com/madelinengo/baby-shower-game/refs/heads/main/images/pics_baby/dad_mindy.jpeg',
        correctParents: { mom: daddy, dad: 'Mindy Kaling' }
    },
    {
        babyId: 'baby3',
        babyImage: 'https://raw.githubusercontent.com/madelinengo/baby-shower-game/refs/heads/main/images/pics_baby/dad_priyanka.jpeg',
        correctParents: { mom: daddy, dad: 'Priyanka Chopra' }
    },
    {
        babyId: 'baby4',
        babyImage: 'https://raw.githubusercontent.com/madelinengo/baby-shower-game/refs/heads/main/images/pics_baby/dad_zendaya.jpeg',
        correctParents: { mom: daddy, dad: 'Zendaya' }
    },
    {
        babyId: 'baby5',
        babyImage: 'https://raw.githubusercontent.com/madelinengo/baby-shower-game/refs/heads/main/images/pics_baby/mom_benedict.jpeg',
        correctParents: { mom: mommy, dad: 'Benedict Cumberbatch' }
    },
    {
        babyId: 'baby6',
        babyImage: 'https://raw.githubusercontent.com/madelinengo/baby-shower-game/refs/heads/main/images/pics_baby/mom_owen.jpeg',
        correctParents: { mom: mommy, dad: 'Owen Wilson' }
    },
    {
        babyId: 'baby7',
        babyImage: 'https://raw.githubusercontent.com/madelinengo/baby-shower-game/refs/heads/main/images/pics_baby/mom_rupert.jpeg',
        correctParents: { mom: mommy, dad: 'Rupert Grint' }
    },
    {
        babyId: 'baby8',
        babyImage: 'https://raw.githubusercontent.com/madelinengo/baby-shower-game/refs/heads/main/images/pics_baby/mom_timothee.jpeg',
        correctParents: { mom: mommy, dad: 'Timothee Chalamet' }
    },
    {
        babyId: 'baby9',
        babyImage: 'https://raw.githubusercontent.com/madelinengo/baby-shower-game/refs/heads/main/images/pics_baby/dad_mom.jpeg',
        correctParents: { mom: mommy, dad: daddy }
    }
];

export const getCoupleString = (mom: string, dad: string) => {
    return `${mom} & ${dad}`
}

export const getCoupleFromString = (coupleString: string) => {
    if (!coupleString) {
        return { mom: '', dad: '' }
    }
    const [mom, dad] = coupleString.split(' & ')
    return { mom: mom || '', dad: dad || '' }
}

export const celebrityImages = {
    'Mommy': 'https://raw.githubusercontent.com/madelinengo/baby-shower-game/refs/heads/main/images/pics_parents_for_app/mom_main.jpeg',
    'Daddy': 'https://raw.githubusercontent.com/madelinengo/baby-shower-game/refs/heads/main/images/pics_parents_for_app/dad_main.jpg',
    'Owen Wilson': 'https://raw.githubusercontent.com/madelinengo/baby-shower-game/refs/heads/main/images/owen.png',
    'Benedict Cumberbatch': 'https://raw.githubusercontent.com/madelinengo/baby-shower-game/refs/heads/main/images/benedict.png',
    'Rupert Grint': 'https://raw.githubusercontent.com/madelinengo/baby-shower-game/refs/heads/main/images/rupert.png',
    'Priyanka Chopra': 'https://raw.githubusercontent.com/madelinengo/baby-shower-game/refs/heads/main/images/priyanka.jpg',
    'Halle Berry': 'https://raw.githubusercontent.com/madelinengo/baby-shower-game/refs/heads/main/images/halle.png',
    'Mindy Kaling': 'https://raw.githubusercontent.com/madelinengo/baby-shower-game/refs/heads/main/images/mindy.jpg',
    'Zendaya': 'https://raw.githubusercontent.com/madelinengo/baby-shower-game/refs/heads/main/images/zendaya.jpeg',
    'Timothee Chalamet': 'https://raw.githubusercontent.com/madelinengo/baby-shower-game/refs/heads/main/images/timothee.png'
};
