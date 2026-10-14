<script lang="ts">
    import { page } from "$app/state";
    const isSignUp = $derived(page.url.searchParams.has("sign-up"));
</script>

<div class="form-container">
    {#if isSignUp}
        <div class="signup-div">
            <h1>Sign-up</h1>
            <p>Please enter your details below to sign-up</p>

            <p>Did you mean to login instead? Click <a href="../form?login">here!</a></p>

            <label for="email">Email</label>
            <input type="text" placeholder="Enter Email" name="email" required /><br />

            <label for="password">Password</label>
            <input type="password" placeholder="Enter Password" name="password" required /><br />

            <label for="password-repeat">Password</label>
            <input type="password" placeholder="Enter Password" name="password-repeat" required /><br />

            <div class="button-container">
                <button type="button" class="cancelbtn">Cancel</button>
                <button type="submit" class="signupbtn">Sign Up</button>
            </div>
        </div>
    {:else}
        <div class="login-div">
            <h1>Login</h1>
            <p>Please enter your details below to login</p>

            <p>Did you mean to sign-up instead? Click <a href="../form?sign-up">here!</a></p>
            <br />

            <label for="email">Email</label>
            <input type="text" placeholder="Enter Email" name="email" required /><br />

            <label for="password">Password</label>
            <input type="password" placeholder="Enter Password" name="password" required /><br />

            <button type="button" class="submit-button">Submit</button><br />

            <div class="button-container">
                <button type="button" class="cancel-button">Cancel</button>
            </div>
        </div>
    {/if}
</div>
