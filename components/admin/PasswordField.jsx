"use client";

import { useState } from "react";

export default function PasswordField() {
  const [visible, setVisible] = useState(false);

  return (
    <label>
      登录密码
      <span className="admin-password-field">
        <input name="password" type={visible ? "text" : "password"} required />
        <button
          aria-label={visible ? "隐藏密码" : "显示密码"}
          type="button"
          onClick={() => setVisible((value) => !value)}
        >
          {visible ? "隐藏" : "显示"}
        </button>
      </span>
    </label>
  );
}
