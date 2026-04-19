const Sign = () => {
    return (
        <>
            <section className="add-card page">
                <h2 className="text-2xl">Welcome Back!</h2>
                <form className="form border-[0.5px] border-[#242424]">
                    <label htmlFor="name" className="label">
                        <span className="title">Username</span>
                        <input
                            className="input-field"
                            type="text"
                            name="input-name"
                            title="Input title"
                            placeholder="Enter your full name"
                        />
                    </label>
                    <label htmlFor="serialCardNumber" className="label">
                        <span className="title">Password</span>
                        <input
                            id="serialCardNumber"
                            className="input-field"
                            type="number"
                            name="input-name"
                            title="Input title"
                            placeholder="Enter Password"
                        />
                    </label>
                    <input className="checkout-btn" type="button" value="Login" />
                </form>
            </section>

        </>
    )
}

export default Sign