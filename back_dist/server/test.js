import axios from "axios";
axios
    .get("https://portal-server.eastmoney.com/bd-portal-server/portal/callEmpInfo", {
    headers: {
        authToken: "42E0207A33103928EB17A50E4CB035F",
    },
    params: {
        employeeId: 230250,
    },
})
    .then((res) => {
    console.log(res.data?.data?.[0]?.USER_PICTURE);
});
