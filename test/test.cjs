const axios = require("axios");
const { EventSource } = require("eventsource");
const baseURL = "https://ctf-dash-security-x.eastmoney.com";
// const baseURL = "http://localhost:51820";
axios.defaults.baseURL = baseURL;
//400 并发测试
async function multipleTest() {
  const ids = new Array(400).fill(0).map((_, i) => "w_test-" + i);
  let completed = 0;
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
        console.log("pending", user);
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
          // pendSSE.onopen(() => {
          //   console.log("pending", user);
          // });
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
          const waitPromise = {
            fn: null,
          };
          await new Promise((res) => {
            gameSSE.onmessage = async (event) => {
              const data = JSON.parse(event.data);
              if (data.type === "gameOver") {
                completed++;
                console.log("completed", completed, "/", ids.length);
                gameSSE.close();
                res();
              } else if (data.type === "drawEnd") {
                await new Promise((res_) => {
                  setTimeout(() => {
                    res_();
                  }, 1000);
                });
                await tryTwoPlayAttack(user, waitPromise);
                await tryTwoPlayAttack(user, waitPromise);
                await endTurn(user);
              } else if (data.type === "waitDefenseCard") {
                await tryPlayDefense(user);
              } else if (data.type === "flushAttack") {
                waitPromise.fn?.();
              } else if (data.type === "initGame") {
                console.log("对决开始", `${user} vs ${data.data.enemy.id}`);
              }
            };
          });
        }
      } catch (error) {}
    })
  );
  console.log("测试结束");

  async function tryTwoPlayAttack(user, waitFn) {
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
      const { data: data1 } = await axios.get("/api/test", {
        headers: {
          Cookie: `user=${user};username=${encodeURIComponent(user)}`,
        },
      });

      if (data1.danger !== -1) {
        await new Promise((res) => {
          waitFn.fn = res;
        });
      }
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
