import sql from "../db/postgres.js";

export const createUsernames = async () => {
  try {
    const adjectives = [
        "Calm",
        "Silent",
        "Swift",
        "Brave",
        "Clever",
        "Gentle",
        "Lucky",
        "Quiet",
        "Sharp",
        "Wise"
    ];

    const animals = [
        "Fox",
        "Tiger",
        "Wolf",
        "Cheetah",
        "Eagle",
        "Panda",
        "Lion",
        "Falcon",
        "Bear",
        "Shark"
    ];

    const numbers = [
        "18",
        "7",
        "45",
        "17",
        "1",
        "333",
        "93",
        "10",
        "15",
        "22"
    ]


    for(const adj of adjectives){
        for(const animal of animals){
            for(const number of numbers){
                const username = adj + " " + animal + " " + number;
                await sql`
                    INSERT INTO usernames(username, assigned_at)
                    VALUES (${username}, ${Date.now()})
                `
            }
        }
    }

    return;
  } catch (error) {
    console.error(error);
    return;
  }
}
