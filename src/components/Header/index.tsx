import { SignInButton } from "../SignInButton";
import styles from "./styles.module.scss";
import Image from "next/image";
import LogoImg from "../../../public/images/logo.svg";

export function Header() {
    return (
        <header className={styles.headerContainer}>
            <div className={styles.headerContent}>
                <Image src={LogoImg} alt="ig.news"/>
                <nav>
                    <a href="" className={styles.active}>Home</a>
                    <a href="">Posts</a>
                </nav>
                <SignInButton />
            </div>
        </header>
    );
}