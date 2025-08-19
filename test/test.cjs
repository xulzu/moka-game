const axios = require("axios");
const { EventSource } = require("eventsource");
const baseURL = "https://card-battle-security-x.eastmoney.com";
// const baseURL = "http://localhost:51820";
axios.defaults.baseURL = baseURL;
//并发测试
async function multipleTest() {
  const ids = new Array(1).fill(0).map((_, i) => "test-" + i);
  await Promise.all(
    ids.map(async (user) => {
      try {
        await axios.get("/api/init", {
          headers: {
            Cookie: `user=${user};username=${encodeURIComponent(user)}`,
          },
          params: {
            user,
          },
        });

        const pendSSE = new EventSource(`${baseURL}/sse/pending?user=${user}`, {
          fetch: (input, init) =>
            fetch(input, {
              ...init,
              headers: {
                ...init.headers,
                Cookie: `user=${user};username=${encodeURIComponent(user)}`,
              },
            }),
        });
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
              fetch: (input, init) =>
                fetch(input, {
                  ...init,
                  headers: {
                    ...init.headers,
                    Cookie: `user=${user};username=${encodeURIComponent(user)}`,
                  },
                }),
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
      const ts = Date.now();
      const { data } = await axios.get("/api/test", {
        headers: {
          Cookie: `user=${user};username=${encodeURIComponent(user)}`,
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
          Cookie: `user=${user};username=${encodeURIComponent(user)}`,
        },
        params: {
          id: attackIds[0],
        },
      });
      console.log("攻击耗时", Date.now() - ts);

      await new Promise((res) => {
        //等待攻击结算
        setTimeout(async () => {
          try {
            const { data } = await axios.get("/api/test", {
              headers: {
                Cookie: `user=${user};username=${encodeURIComponent(user)}`,
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
          Cookie: `user=${user};username=${encodeURIComponent(user)}`,
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
          Cookie: `user=${user};username=${encodeURIComponent(user)}`,
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
          Cookie: `user=${user};username=${encodeURIComponent(user)}`,
        },
      });
    } catch (error) {}
  }
}
multipleTest();
