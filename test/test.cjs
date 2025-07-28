const axios = require("axios");
const { EventSource } = require("eventsource");
const baseURL = "http://1.94.151.122:51820";
// const baseURL = "http://localhost:4004";
axios.defaults.baseURL = baseURL;
//并发测试
async function multipleTest() {
  const ids = new Array(400).fill(0).map((_, i) => "test-" + i);
  await Promise.all(
    ids.map(async (user) => {
      try {
        await axios.get("/api/init", {
          params: {
            user,
          },
        });

        const pendSSE = new EventSource(`${baseURL}/sse/pending?user=${user}`);
        const tag = await new Promise((res) => {
          pendSSE.onmessage = (e) => {
            res(e.data);
            pendSSE.close();
          };
        });
        if (tag) {
          const gameSSE = new EventSource(
            `${baseURL}/sse/connect?user=${user}`,
            {
              headers: {
                Cookie: "user=" + user,
              },
            }
          );
          await new Promise((res) => {
            gameSSE.onmessage = async (event) => {
              const data = JSON.parse(event.data);
              if (data.type === "gameOver") {
                gameSSE.close();
                res();
              } else if (data.type === "drawEnd") {
                await tryTwoPlayAttack(user);
                await tryTwoPlayAttack(user);
                await endTurn(user);
              } else if (data.type === "waitDefenseCard") {
                await tryPlayDefense(user);
              }
            };
          });
        }
      } catch (error) {}
    })
  );
  console.log("测试结束");

  async function tryTwoPlayAttack(user) {
    try {
      const { data } = await axios.get("/api/test", {
        headers: {
          Cookie: "user=" + user,
        },
      });
      const { hands } = data;
      const attackIds = hands
        .filter((item) => item.type === "attack")
        .map((item) => item.id);
      if (attackIds.length === 0) {
        return;
      }
      await axios.get("/api/play", {
        headers: {
          Cookie: "user=" + user,
        },
        params: {
          id: attackIds[0],
        },
      });

      await new Promise((res) => {
        //等待攻击结算
        setTimeout(async () => {
          try {
            const { data } = await axios.get("/api/test", {
              headers: {
                Cookie: "user=" + user,
              },
            });
            if (data.danger === -1) {
              res();
            }
          } catch (error) {
            res();
          }
        }, 1000);
      });
    } catch (error) {}
  }

  async function tryPlayDefense(user) {
    try {
      const { data } = await axios.get("/api/test", {
        headers: {
          Cookie: "user=" + user,
        },
      });
      const { hands } = data;
      const defenseIds = hands
        .filter((item) => item.type === "defense")
        .map((item) => item.id);
      if (defenseIds.length === 0) {
        return;
      }
      await axios.get("/api/play", {
        headers: {
          Cookie: "user=" + user,
        },
        params: {
          id: defenseIds[0],
        },
      });
    } catch (error) {}
  }

  async function endTurn(user) {
    try {
      await axios.get("/api/turnEnd", {
        headers: {
          Cookie: "user=" + user,
        },
      });
    } catch (error) {}
  }
}
multipleTest();
