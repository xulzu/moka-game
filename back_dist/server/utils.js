import axios from "axios";
export async function queryAvatar(userid) {
    return axios
        .get("https://portal-server.eastmoney.com/bd-portal-server/portal/callEmpInfo", {
        headers: {
            authToken: "42E0207A33103928EB17A50E4CB035F",
        },
        params: {
            employeeId: userid,
        },
    })
        .then((res) => {
        return res.data?.data?.[0]?.USER_PICTURE;
    })
        .catch((res) => {
        console.error("查询咚咚头像出错/bd-portal-server/portal/callEmpInfo:", res);
        return "";
    });
}
