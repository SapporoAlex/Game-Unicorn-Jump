import pygame
import os
import random

# Global constants
pygame.init()
pygame.display.set_caption("Unicorn Jump Game")

SCREEN_HEIGHT = 600
SCREEN_WIDTH = 1100

SCREEN = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))

MOMO = pygame.image.load("Assets/other/was.jpg")

GALLOPING = [pygame.image.load(os.path.join("Assets/unicorn", "unicorngalloping1.png")),
             pygame.image.load(os.path.join("Assets/unicorn", "unicorngalloping2.png"))]
JUMPING = pygame.image.load(os.path.join("Assets/unicorn", "unicornjumping.png"))
DUCKING = [pygame.image.load(os.path.join("Assets/unicorn", "unicornducking1.png")),
           pygame.image.load(os.path.join("Assets/unicorn", "unicornducking2.png"))]
SMALL_RAINBOW = [pygame.image.load(os.path.join("Assets/obstacles", "smallrainbow1.png")),
                 pygame.image.load(os.path.join("Assets/obstacles", "smallrainbow2.png")),
                 pygame.image.load(os.path.join("Assets/obstacles", "smallrainbow3.png"))]
LARGE_RAINBOW = [pygame.image.load(os.path.join("Assets/obstacles", "largerainbow1.png")),
                 pygame.image.load(os.path.join("Assets/obstacles", "largerainbow2.png")),
                 pygame.image.load(os.path.join("Assets/obstacles", "largerainbow3.png"))]
STAR = [pygame.image.load(os.path.join("Assets/star", "star1.png")),
        pygame.image.load(os.path.join("Assets/star", "star2.png"))]
CLOUD = pygame.image.load(os.path.join("Assets/other", "cloud.png"))
BG = pygame.image.load(os.path.join("Assets/other", "track.png"))


class Unicorn:
    X_POS = 80
    Y_POS = 310
    Y_POS_DUCK = 350
    JUMP_VEL = 8.5

    def __init__(self):
        self.duck_img = DUCKING
        self.gallop_img = GALLOPING
        self.jump_img = JUMPING

        self.unicorn_duck = False
        self.unicorn_gallop = True
        self.unicorn_jump = False

        self.step_index = 0
        self.jump_vel = self.JUMP_VEL
        self.image = self.gallop_img[0]
        self.unicorn_rect = self.image.get_rect()
        self.unicorn_rect.x = self.X_POS
        self.unicorn_rect.y = self.Y_POS

    def update(self, user_input):
        if self.unicorn_duck:
            self.duck()
        if self.unicorn_gallop:
            self.gallop()
        if self.unicorn_jump:
            self.jump()

        if self.step_index >= 10:
            self.step_index = 0

        if user_input[pygame.K_UP] and not self.unicorn_jump:
            self.unicorn_duck = False
            self.unicorn_gallop = False
            self.unicorn_jump = True
        elif user_input[pygame.K_DOWN] and not self.unicorn_jump:
            self.unicorn_duck = True
            self.unicorn_gallop = False
            self.unicorn_jump = False
        elif not (self.unicorn_jump or user_input[pygame.K_DOWN]):
            self.unicorn_duck = False
            self.unicorn_gallop = True
            self.unicorn_jump = False

    def duck(self):
        self.image = self.duck_img[self.step_index // 5]
        self.unicorn_rect = self.image.get_rect()
        self.unicorn_rect.x = self.X_POS
        self.unicorn_rect.y = self.Y_POS_DUCK
        self.step_index += 1

    def gallop(self):
        self.image = self.gallop_img[self.step_index // 5]
        self.unicorn_rect = self.image.get_rect()
        self.unicorn_rect.x = self.X_POS
        self.unicorn_rect.y = self.Y_POS
        self.step_index += 1

    def jump(self):
        self.image = self.jump_img
        if self.unicorn_jump:
            self.unicorn_rect.y -= self.jump_vel * 4
            self.jump_vel -= 0.8
        if self.jump_vel < - self.JUMP_VEL:
            self.unicorn_jump = False
            self.jump_vel = self.JUMP_VEL

    def draw(self, SCREEN):
        SCREEN.blit(self.image, (self.unicorn_rect.x, self.unicorn_rect.y))


class Cloud:
    def __init__(self):
        self.x = SCREEN_WIDTH + random.randint(800, 1000)
        self.y = random.randint(50, 100)
        self.image = CLOUD
        self.width = self.image.get_width()

    def update(self):
        self.x -= game_speed
        if self.x < -self.width:
            self.x = SCREEN_WIDTH + random.randint(2500, 3000)
            self.y = random.randint(50, 100)

    def draw(self, SCREEN):
        SCREEN.blit(self.image, (self.x, self.y))


class Obstacle:
    def __init__(self, image, type):
        self.image = image
        self.type = type
        self.rect = self.image[self.type].get_rect()
        self.rect.x = SCREEN_WIDTH

    def update(self):
        self.rect.x -= game_speed
        if self.rect.x < -self.rect.width:
            obstacles.pop()

    def draw(self, SCREEN):
        SCREEN.blit(self.image[self.type], self.rect)


class SmallRainbow(Obstacle):
    def __init__(self, image):
        self.type = random.randint(0, 2)
        super() .__init__(image, self.type)
        self.rect.y = 325


class LargeRainbow(Obstacle):
    def __init__(self, image):
        self.type = random.randint(0, 2)
        super() .__init__(image, self.type)
        self.rect.y = 325


class Star(Obstacle):
    def __init__(self, image):
        self.type = 0
        super() .__init__(image, self.type)
        self.rect.y = 270
        self.index = 0

    def draw(self, SCREEN):
        if self.index >= 9:
            self.index = 0
        SCREEN.blit(self.image[self.index//5], self.rect)
        self.index += 1


def main():
    global game_speed, x_pos_bg, y_pos_bg, points, obstacles
    run = True
    clock = pygame.time.Clock()
    player = Unicorn()
    cloud = Cloud()
    game_speed = 15
    x_pos_bg = 0
    y_pos_bg = 375
    points = 0
    font = pygame.font.Font('freesansbold.ttf', 20)
    obstacles = []
    death_count = 0

    def score():
        global points, game_speed
        points += 1
        if points % 100 == 0:
            game_speed += 1

        text = font.render("Points: " + str(points), True, (0, 0, 0))
        textRect = text.get_rect()
        textRect.center = (1000, 40)
        SCREEN.blit(text, textRect)

    def background():
        global x_pos_bg, y_pos_bg
        image_width = BG.get_width()
        SCREEN.blit(BG, (x_pos_bg, y_pos_bg))
        SCREEN.blit(BG, (image_width + x_pos_bg, y_pos_bg))
        if x_pos_bg <= -image_width:
            SCREEN.blit(BG, (image_width + x_pos_bg, y_pos_bg))
            x_pos_bg = 0
        x_pos_bg -= game_speed

    while run:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                run = False

        SCREEN.blit(MOMO, (0, 0))
        user_input = pygame.key.get_pressed()

        background()

        cloud.draw(SCREEN)
        cloud.update()

        player.draw(SCREEN)
        player.update(user_input)

        if len(obstacles) == 0:
            if random.randint(0, 2) == 0:
                obstacles.append(SmallRainbow(SMALL_RAINBOW))
            elif random.randint(0, 2) == 1:
                obstacles.append(LargeRainbow(LARGE_RAINBOW))
            elif random.randint(0, 2) == 2:
                obstacles.append(Star(STAR))

        for obstacle in obstacles:
            obstacle.draw(SCREEN)
            obstacle.update()
            if player.unicorn_rect.colliderect(obstacle.rect):
                pygame.time. delay(2000)
                death_count += 1
                menu(death_count)

        score()

        clock.tick(30)
        pygame.display.update()


def menu(death_count):
    global points
    run = True
    while run:
        SCREEN.fill((255, 255, 255))
        font = pygame.font.Font('freesansbold.ttf', 30)
        pygame.init()
        if death_count == 0:
            text = font.render("Press any Key to Start", True, (0, 0, 0))
        elif death_count > 0:
            text = font.render("Press any Key to Restart", True, (0, 0, 0))
            score = font.render("Your Score: " + str(points), True, (0, 0, 0))
            scoreRect = score.get_rect()
            scoreRect.center = (SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + 50)
            SCREEN.blit(score, scoreRect)
        textRect = text.get_rect()
        textRect.center = (SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2)
        SCREEN.blit(text, textRect)
        SCREEN.blit(CLOUD, (SCREEN_WIDTH // 2 - 60, SCREEN_HEIGHT // 2 - 140))
        pygame.display.update()
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                run = False
                pygame.quit()
            if event.type == pygame.KEYDOWN:
                main()


menu(death_count=0)
