"""
微信读书 API 客户端。
封装 Agent API Gateway 调用，处理鉴权、版本上报、错误处理。
"""
import os
import json
import urllib.request
import urllib.error

GATEWAY_URL = "https://i.weread.qq.com/api/agent/gateway"
SKILL_VERSION = "1.0.3"


class ApiError(Exception):
    """API 返回的业务错误。"""
    def __init__(self, errcode: int, errmsg: str, errlog: str = ""):
        self.errcode = errcode
        self.errmsg = errmsg
        self.errlog = errlog
        super().__init__(f"[{errcode}] {errmsg}")


class AuthError(ApiError):
    """鉴权失败。"""
    pass


def _get_api_key() -> str:
    key = os.environ.get("WEREAD_API_KEY")
    if not key:
        raise AuthError(-1, "WEREAD_API_KEY 未设置。请执行 export WEREAD_API_KEY=wrk-xxxxxxxx")
    return key


def call(api_name: str, **kwargs) -> dict:
    """
    调用微信读书 Agent API Gateway。

    Args:
        api_name: 接口名，如 '/shelf/sync'
        **kwargs: 业务参数，平铺在 body 顶层

    Returns:
        解析后的 JSON 字典

    Raises:
        ApiError: API 返回 errcode 非 0
        AuthError: 鉴权失败
    """
    key = _get_api_key()
    body = {"api_name": api_name, "skill_version": SKILL_VERSION, **kwargs}
    data = json.dumps(body, ensure_ascii=False).encode("utf-8")

    req = urllib.request.Request(
        GATEWAY_URL,
        data=data,
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            result = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        raise ApiError(e.code, f"HTTP {e.code}: {e.reason}")
    except urllib.error.URLError as e:
        raise ApiError(-2, f"网络错误: {e.reason}")
    except json.JSONDecodeError as e:
        raise ApiError(-3, f"响应解析失败: {e}")

    errcode = result.get("errcode", 0)
    if errcode != 0:
        errmsg = result.get("errmsg", "未知错误")
        errlog = result.get("errlog", "")
        if errcode == -2010:
            raise AuthError(errcode, errmsg, errlog)
        raise ApiError(errcode, errmsg, errlog)

    # 检查升级
    if "upgrade_info" in result:
        info = result["upgrade_info"]
        raise ApiError(0, f"需要升级: {info.get('message', '')}")

    return result


def list_all_notebooks() -> list[dict]:
    """
    遍历所有笔记本（分页）。
    返回排序后的完整列表。
    """
    all_books = []
    last_sort = None
    while True:
        params = {"count": 100}
        if last_sort is not None:
            params["lastSort"] = last_sort
        data = call("/user/notebooks", **params)
        books = data.get("books", [])
        all_books.extend(books)
        if data.get("hasMore") != 1 or not books:
            break
        last_sort = books[-1]["sort"]
    return all_books
