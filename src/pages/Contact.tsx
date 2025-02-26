import { useState } from "react";

const Contact = () => {
  const [value,setValue] = useState("")
  return (
    <div>
      <input 
        type="text" 
        value={value} 
        onChange={(event:any) => {
          setValue(event.target.value)
        }}
      />

      {
        value !== "" && <span>Holin</span>
      }
    </div>
  )
}

export default Contact;