import { Dropdown, DropItem } from "./Dropdown";
const User = () => {
    return (
        <Dropdown title="TheLinuxGuy" className="profile-btn fixed right-4 top-4">
            <DropItem>Hello</DropItem>
            <DropItem>thanks</DropItem>
        </Dropdown>
    )
}

export default User;